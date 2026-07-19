#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

from task_inventory import inspect_task_root, sanitize_image_component


SKILL_VARIANTS = (
    "no-skill",
    "raw-skill",
    "skillos",
    "skillos-provider-swapped",
)

VARIANT_TO_TASK_ROOT = {
    "no-skill": "tasks-no-skill",
    "raw-skill": "tasks",
    "skillos": "tasks-skillos",
    "skillos-provider-swapped": "tasks-skillos-provider-swapped",
}

IMAGE_SKILL_BUNDLE_DIR = "/opt/skill-layer/skills"
MAX_CODEX_SKILL_NAME_LEN = 64
FINAL_RUNTIME_PACKAGES = {
    "apt-get": "bash ca-certificates curl git jq python3 python3-pip ripgrep",
    "apk": "bash ca-certificates curl git jq python3 py3-pip ripgrep",
    "dnf": "bash ca-certificates curl-minimal git jq python3 python3-pip ripgrep",
    "yum": "bash ca-certificates curl-minimal git jq python3 python3-pip ripgrep",
    "microdnf": "bash ca-certificates curl-minimal git jq python3 python3-pip ripgrep",
}


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_if_exists(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if src.is_dir():
        shutil.copytree(src, dst)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def remove_skills_dir(task_context_dir: Path) -> None:
    skills_dir = task_context_dir / "environment" / "skills"
    if skills_dir.exists():
        shutil.rmtree(skills_dir)


def copy_verifier_skills_snapshot(src_task_dir: Path, env_context_dir: Path) -> bool:
    """Keep a verifier-only copy of task skills without exposing them to agents."""
    skills_dir = src_task_dir / "environment" / "skills"
    if not skills_dir.exists():
        return False

    verifier_skills_dir = env_context_dir / "verifier-skills"
    if verifier_skills_dir.exists():
        shutil.rmtree(verifier_skills_dir)
    shutil.copytree(skills_dir, verifier_skills_dir)
    return True


def strip_skill_copy_lines(dockerfile_text: str) -> str:
    kept_lines = []
    for line in dockerfile_text.splitlines():
        stripped = line.strip()
        if re.match(r"^(COPY|ADD)\s+skills/?(\s|$)", stripped):
            if kept_lines and kept_lines[-1].rstrip().endswith("\\"):
                kept_lines[-1] = kept_lines[-1].rstrip().removesuffix("\\").rstrip()
            continue
        if "Copy skills to all agent paths" in line:
            continue
        kept_lines.append(line)
    return "\n".join(kept_lines).rstrip() + "\n"


def normalize_pip_installs(dockerfile_text: str) -> str:
    def _add_break_system_packages(match: re.Match[str]) -> str:
        command = match.group(0)
        if "--break-system-packages" in command:
            return command
        if re.search(r"(?im)^\s*FROM\s+(?:--platform=\S+\s+)?ubuntu:20\.04\b", dockerfile_text):
            return command
        if re.search(r"(?im)^\s*FROM\s+jasonish/suricata:", dockerfile_text):
            return command
        return re.sub(r"\binstall\b", "install --break-system-packages", command, count=1)

    patterns = (
        r"\bpip3?\s+install\b[^\n]*",
        r"\bpython(?:3)?\s+-m\s+pip\s+install\b[^\n]*",
    )

    text = dockerfile_text
    for pattern in patterns:
        text = re.sub(pattern, _add_break_system_packages, text)
    return text


def ensure_apt_packages(dockerfile_text: str, packages: list[str]) -> str:
    pattern = re.compile(
        r"(RUN\s+apt-get\s+update\s*&&\s*apt-get\s+install\s+-y(?:\s+--no-install-recommends)?\s+)(.*?)(\s*&&\s*rm\s+-rf\s+/var/lib/apt/lists/\*)",
        re.DOTALL,
    )
    match = pattern.search(dockerfile_text)
    if not match:
        return dockerfile_text

    packages_block = match.group(2)
    missing = [pkg for pkg in packages if pkg not in packages_block]
    if not missing:
        return dockerfile_text

    prefix = "".join(f"{pkg} \\\n    " for pkg in missing)
    updated_packages_block = f"{prefix}{packages_block.lstrip()}"
    return (
        dockerfile_text[: match.start()]
        + match.group(1)
        + updated_packages_block
        + match.group(3)
        + dockerfile_text[match.end() :]
    )


def rewrite_seisbench_runtime(dockerfile_text: str) -> str:
    # Only rewrite an actual pip install of seisbench. Some Dockerfiles mention
    # SeisBench in comments; treating comments as install sites can move RUN/ENV
    # instructions before the first FROM and produce an invalid Dockerfile.
    if not re.search(
        r"(?im)^\s*RUN\s+.*\bpip(?:3)?\s+install\b.*\bseisbench\b",
        dockerfile_text,
    ):
        return dockerfile_text

    lines = dockerfile_text.splitlines()
    out_lines: list[str] = []
    replaced = False
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip().lower()
        if "seisbench" in stripped and "pip" in stripped and not replaced:
            if out_lines and out_lines[-1].strip().lower().startswith("run ") and "pip" in out_lines[-1].lower():
                out_lines.pop()
            out_lines.extend(
                [
                    "# Use micromamba for the compiled scientific stack, then pip-install SeisBench itself.",
                    "ENV MAMBA_ROOT_PREFIX=/opt/micromamba",
                    "RUN set -eux; \\",
                    "    arch=\"$(dpkg --print-architecture)\"; \\",
                    "    case \"${arch}\" in \\",
                    "        amd64) mamba_arch=\"64\" ;; \\",
                    "        arm64) mamba_arch=\"aarch64\" ;; \\",
                    '        *) echo \"Unsupported arch for micromamba: ${arch}\" >&2; exit 1 ;; \\',
                    "    esac; \\",
                    "    curl -Ls \"https://micro.mamba.pm/api/micromamba/linux-${mamba_arch}/latest\" | tar -xj -C /usr/local/bin --strip-components=1 bin/micromamba; \\",
                    "    micromamba create -y -n taskenv -c conda-forge python=3.11 pip obspy=1.5.0; \\",
                    "    micromamba clean -a -y",
                    "ENV PATH=/opt/micromamba/envs/taskenv/bin:/opt/micromamba/bin:${PATH}",
                    "# Prefer the CPU wheel so Linux arm64 builds do not pull CUDA packages.",
                    "RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \\",
                    "    torch==2.5.1",
                    "RUN pip install --no-cache-dir \\",
                    "    seisbench==0.10.2",
                ]
            )
            replaced = True
            i += 1
            continue

        out_lines.append(line)
        i += 1

    return "\n".join(out_lines).rstrip() + "\n"


def rewrite_coursier_runtime(dockerfile_text: str) -> str:
    """Use a coursier launcher matching the container architecture."""
    pattern = re.compile(
        r"RUN\s+curl\s+-fL\s+https://github\.com/coursier/coursier/releases/download/v2\.1\.25-M23/cs-x86_64-pc-linux\.gz\s*\|\s*gzip\s+-d\s*>\s*cs\s*&&\s*chmod\s+\+x\s+cs\s*&&\s*\./cs\s+setup\s+--yes\s*&&\s*\./cs\s+install\s+scala:2\.13\.12\s+scalac:2\.13\.12"
    )
    replacement = """RUN set -eux; \\
    arch="$(uname -m)"; \\
    case "${arch}" in \\
        x86_64) cs_arch="x86_64" ;; \\
        aarch64|arm64) cs_arch="aarch64" ;; \\
        *) echo "Unsupported architecture for coursier: ${arch}" >&2; exit 1 ;; \\
    esac; \\
    curl -fL "https://github.com/coursier/coursier/releases/download/v2.1.25-M23/cs-${cs_arch}-pc-linux.gz" | gzip -d > cs; \\
    chmod +x cs; \\
    ./cs setup --yes; \\
    ./cs install scala:2.13.12 scalac:2.13.12"""
    return pattern.sub(replacement, dockerfile_text)


def rewrite_scheduling_email_verifier_skills(dockerfile_text: str) -> str:
    return dockerfile_text


def rewrite_whisper_build_isolation(dockerfile_text: str) -> str:
    if "openai-whisper==20231117" not in dockerfile_text:
        return dockerfile_text
    text = dockerfile_text
    text = re.sub(
        r"pip\s+install(?:\s+--break-system-packages)?\s+--no-cache-dir\s+-U\s+pip\s+setuptools\s+wheel",
        "pip install --break-system-packages --no-cache-dir -U pip 'setuptools<81' wheel",
        text,
    )
    text = re.sub(
        r"pip\s+install\s+--no-cache-dir\s+-U\s+pip\s+setuptools\s+wheel",
        "pip install --no-cache-dir -U pip 'setuptools<81' wheel",
        text,
    )
    text = text.replace(
        "RUN pip install --break-system-packages --no-cache-dir \\\n    speechbrain==1.0.3",
        "RUN pip install --break-system-packages --no-cache-dir --no-build-isolation \\\n    speechbrain==1.0.3",
    )
    text = text.replace(
        "RUN pip install --no-cache-dir \\\n    speechbrain==1.0.3",
        "RUN pip install --no-cache-dir --no-build-isolation \\\n    speechbrain==1.0.3",
    )
    text = text.replace(
        'RUN python -c "import whisper; whisper.load_model(\'large-v3\')" && \\\n'
        '    python -c "from speechbrain.inference.VAD import VAD; VAD.from_hparams(source=\'speechbrain/vad-crdnn-libriparty\', savedir=\'/tmp/speechbrain_vad\')" && \\\n'
        '    python -c "from speechbrain.inference.speaker import EncoderClassifier; EncoderClassifier.from_hparams(source=\'speechbrain/spkrec-ecapa-voxceleb\', savedir=\'/tmp/speechbrain_encoder\')"',
        'RUN python -c "import os, whisper; whisper._download(whisper._MODELS[\'large-v3\'], os.path.expanduser(\'~/.cache/whisper\'), False)" && \\\n'
        '    python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id=\'speechbrain/vad-crdnn-libriparty\', local_dir=\'/tmp/speechbrain_vad\', local_dir_use_symlinks=False)" && \\\n'
        '    python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id=\'speechbrain/spkrec-ecapa-voxceleb\', local_dir=\'/tmp/speechbrain_encoder\', local_dir_use_symlinks=False)"',
    )
    return text


def rewrite_suricata_pip_install(dockerfile_text: str) -> str:
    if "jasonish/suricata" not in dockerfile_text or "scapy==2.5.0" not in dockerfile_text:
        return dockerfile_text
    return dockerfile_text.replace(
        "RUN pip3 install --break-system-packages scapy==2.5.0",
        "RUN python3 -m pip install --user scapy==2.5.0",
    ).replace(
        "RUN pip3 install scapy==2.5.0",
        "RUN python3 -m pip install --user scapy==2.5.0",
    )


def rewrite_marker_pdf_cpu_torch(dockerfile_text: str) -> str:
    if "marker-pdf" not in dockerfile_text:
        return dockerfile_text
    if "download.pytorch.org/whl/cpu" in dockerfile_text:
        return dockerfile_text

    cpu_torch_install = (
        "# Prefer the CPU torch wheel so PDF/OCR tasks do not pull CUDA packages.\n"
        "RUN pip3 install --break-system-packages --no-cache-dir \\\n"
        "     --index-url https://download.pytorch.org/whl/cpu \\\n"
        "     torch==2.5.1\n\n"
    )

    return re.sub(
        r"(?m)^(# Install Python dependencies\n)",
        cpu_torch_install + r"\1",
        dockerfile_text,
        count=1,
    )


def patch_known_task_dockerfile_quirks(dockerfile_text: str) -> str:
    text = rewrite_coursier_runtime(dockerfile_text)
    text = rewrite_scheduling_email_verifier_skills(text)
    text = rewrite_whisper_build_isolation(text)
    text = rewrite_suricata_pip_install(text)
    text = rewrite_marker_pdf_cpu_torch(text)
    return text


def ensure_build_essentials_for_source_builds(dockerfile_text: str) -> str:
    needs_compiler = any(
        needle in dockerfile_text
        for needle in (
            "seisbench",
            "obspy",
        )
    )
    if not needs_compiler:
        return dockerfile_text

    packages = ["build-essential"]
    if "seisbench" in dockerfile_text:
        packages.extend(["bzip2", "ca-certificates", "curl"])
    return ensure_apt_packages(dockerfile_text, packages)


def split_global_prefix(dockerfile_text: str) -> tuple[str, str]:
    lines = dockerfile_text.splitlines()
    for idx, line in enumerate(lines):
        if re.match(r"^\s*FROM\b", line, re.IGNORECASE):
            prefix = "\n".join(lines[:idx]).rstrip()
            body = "\n".join(lines[idx:]).rstrip()
            return prefix, body
    raise ValueError("Dockerfile does not contain a FROM instruction")


def alias_last_from_stage(dockerfile_text: str, alias: str) -> str:
    lines = dockerfile_text.splitlines()
    from_indices = [
        idx for idx, line in enumerate(lines) if re.match(r"^\s*FROM\b", line, re.IGNORECASE)
    ]
    if not from_indices:
        raise ValueError("Dockerfile does not contain a FROM instruction")

    last_from_idx = from_indices[-1]
    match = re.match(
        r"^(?P<indent>\s*)FROM(?P<body>\s+.+?)(?:\s+AS\s+\S+)?\s*$",
        lines[last_from_idx],
        re.IGNORECASE,
    )
    if not match:
        raise ValueError(f"Could not rewrite final FROM line: {lines[last_from_idx]!r}")

    lines[last_from_idx] = f"{match.group('indent')}FROM{match.group('body')} AS {alias}"
    return "\n".join(lines).rstrip() + "\n"


def rewrite_task_dockerfile(source_text: str) -> str:
    text = strip_skill_copy_lines(source_text)
    text = normalize_pip_installs(text)
    text = ensure_build_essentials_for_source_builds(text)
    text = rewrite_seisbench_runtime(text)
    text = patch_known_task_dockerfile_quirks(text)
    prefix, body = split_global_prefix(text)
    body = alias_last_from_stage(body, "taskenv")

    out_parts = ["ARG HARNESS_IMAGE"]
    if prefix:
        out_parts.append(prefix)
    out_parts.extend(
        [
            "FROM ${HARNESS_IMAGE} AS harness",
            "",
            body.rstrip(),
        ]
    )
    return "\n".join(out_parts).rstrip() + "\n"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_skill_name_for_runtime(name: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9_.-]+", "-", name.strip()).strip("-")
    if not normalized:
        normalized = "skill"
    if len(normalized) <= MAX_CODEX_SKILL_NAME_LEN:
        return normalized

    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]
    max_prefix_len = MAX_CODEX_SKILL_NAME_LEN - len(digest) - 1
    prefix = normalized[:max_prefix_len].rstrip("-_.") or "skill"
    return f"{prefix}-{digest}"


def normalize_skill_frontmatter_names(skills_root: Path) -> list[dict[str, str]]:
    """Make copied skill metadata loadable by runtimes with strict name limits."""
    normalized: list[dict[str, str]] = []
    if not skills_root.exists():
        return normalized

    for skill_md in sorted(skills_root.rglob("SKILL.md")):
        text = skill_md.read_text(encoding="utf-8", errors="replace")
        if not text.startswith("---"):
            continue

        match = re.match(r"(?s)^---\s*\n(.*?)\n---\s*\n?(.*)$", text)
        if not match:
            continue

        frontmatter = match.group(1)
        body = match.group(2)
        name_match = re.search(r"(?m)^name:\s*(.+?)\s*$", frontmatter)
        if not name_match:
            continue

        raw_name = name_match.group(1).strip().strip("\"'")
        runtime_name = normalize_skill_name_for_runtime(raw_name)
        if runtime_name == raw_name:
            continue

        updated_frontmatter = re.sub(
            r"(?m)^name:\s*.+?\s*$",
            f"name: {runtime_name}",
            frontmatter,
            count=1,
        )
        skill_md.write_text(
            f"---\n{updated_frontmatter}\n---\n{body}",
            encoding="utf-8",
        )
        normalized.append(
            {
                "path": str(skill_md.relative_to(skills_root)),
                "original_name": raw_name,
                "runtime_name": runtime_name,
            }
        )

    return normalized


def build_task_context(src_task_dir: Path, out_root: Path) -> Path:
    task_id = src_task_dir.name
    task_root = out_root / sanitize_image_component(task_id)
    context_dir = task_root / "context"
    env_context_dir = context_dir / "environment"
    dockerfile_path = task_root / "Dockerfile"
    reset_dir(task_root)
    context_dir.mkdir(parents=True, exist_ok=True)

    # Keep the task tree available for snapshot/export purposes.
    copy_if_exists(src_task_dir / "instruction.md", context_dir / "instruction.md")
    copy_if_exists(src_task_dir / "task.toml", context_dir / "task.toml")
    copy_if_exists(src_task_dir / "solution", context_dir / "solution")
    copy_if_exists(src_task_dir / "tests", context_dir / "tests")

    # Keep a snapshot copy of environment/ for export and debugging.
    shutil.copytree(src_task_dir, env_context_dir, dirs_exist_ok=True)
    has_verifier_skills = copy_verifier_skills_snapshot(src_task_dir, env_context_dir)
    remove_skills_dir(env_context_dir)

    # Harbor builds with task/environment as the Docker build context. To keep
    # the original SkillsBench COPY instructions working, mirror the non-skill
    # environment payload into the task-layer build-context root.
    for child in sorted((src_task_dir / "environment").iterdir()):
        if child.name in {"Dockerfile", "skills"}:
            continue
        copy_if_exists(child, task_root / child.name)
    if has_verifier_skills:
        copy_if_exists(env_context_dir / "verifier-skills", task_root / "verifier-skills")

    dockerfile = "\n".join(
        [
            "ARG HARNESS_IMAGE",
            "FROM ${HARNESS_IMAGE}",
            "",
            "RUN set -eux; \\",
            "    mkdir -p /workspace /logs/artifacts /logs/agent /logs/verifier /opt/task; \\",
            "    chmod -R 777 /workspace /logs; \\",
            "    if [ -x /usr/bin/python3 ] && [ ! -e /usr/local/bin/python ]; then ln -sf /usr/bin/python3 /usr/local/bin/python; fi; \\",
            "    if [ -x /usr/local/bin/node ]; then ln -sf /usr/local/bin/node /usr/bin/node 2>/dev/null || true; fi",
            "RUN set -eux; \\",
            "    python3 - <<'PY' || python3 -m pip install --break-system-packages --no-cache-dir requests openpyxl anthropic",
            "import importlib",
            "for module in ('requests', 'openpyxl', 'anthropic'):",
            "    importlib.import_module(module)",
            "PY",
            "",
            "# Preserve the task payload inside the task layer image.",
            "COPY context/instruction.md /opt/task/instruction.md",
            "COPY context/task.toml /opt/task/task.toml",
            "COPY context/solution /opt/task/solution",
            "COPY context/tests /opt/task/tests",
            "COPY context/environment /opt/task/environment",
        ]
    )
    dockerfile += "\n"
    write_text(dockerfile_path, dockerfile)
    write_json(
        task_root / "manifest.json",
        {
            "task_id": task_id,
            "image_task_id": sanitize_image_component(task_id),
            "source_task_dir": str(src_task_dir),
            "layer": "task",
            "contains_skills": False,
            "source_environment_dockerfile": str(src_task_dir / "environment" / "Dockerfile"),
            "build_context_dir": str(task_root),
        },
    )
    return task_root


def detect_variant_skills_dir(task_dir: Path) -> Path | None:
    skills_dir = task_dir / "environment" / "skills"
    if skills_dir.exists():
        return skills_dir
    return None


def build_skill_context(
    task_id: str,
    variant: str,
    variant_task_dir: Path,
    out_root: Path,
) -> Path:
    skill_root = out_root / sanitize_image_component(task_id) / variant
    context_dir = skill_root / "context"
    dockerfile_path = skill_root / "Dockerfile"
    reset_dir(skill_root)
    context_dir.mkdir(parents=True, exist_ok=True)

    skills_dir = detect_variant_skills_dir(variant_task_dir)
    normalized_skill_names: list[dict[str, str]] = []
    if skills_dir and variant != "no-skill":
        shutil.copytree(skills_dir, context_dir / "skills")
        normalized_skill_names = normalize_skill_frontmatter_names(context_dir / "skills")

    dockerfile_lines = [
        "ARG TASK_IMAGE",
        "ARG HARNESS_NAME",
        "FROM ${TASK_IMAGE}",
    ]

    if variant != "no-skill":
        dockerfile_lines.extend(
            [
                "",
                "COPY context/skills /opt/skill-layer/skills",
                "RUN set -eux; \\",
                "    link_skill_dir() { \\",
                '        target=\"$1\"; \\',
                '        mkdir -p \"$(dirname \"$target\")\"; \\',
                '        rm -rf \"$target\"; \\',
                f'        ln -s {IMAGE_SKILL_BUNDLE_DIR} \"$target\"; \\',
                "    }; \\",
                "    for home in /root /home/*; do \\",
                '        [ -d \"$home\" ] || continue; \\',
                '        link_skill_dir \"$home/.claude/skills\"; \\',
                '        link_skill_dir \"$home/.codex/skills\"; \\',
                '        link_skill_dir \"$home/.gemini/skills\"; \\',
                '        link_skill_dir \"$home/.hermes/skills\"; \\',
                '        link_skill_dir \"$home/.kilo/skills\"; \\',
                '        link_skill_dir \"$home/.openclaw/skills\"; \\',
                "    done",
            ]
        )

    write_text(dockerfile_path, "\n".join(dockerfile_lines) + "\n")
    write_json(
        skill_root / "manifest.json",
        {
            "task_id": task_id,
            "image_task_id": sanitize_image_component(task_id),
            "variant": variant,
            "source_task_dir": str(variant_task_dir),
            "layer": "skill",
            "contains_skills": variant != "no-skill",
            "image_skill_bundle_dir": IMAGE_SKILL_BUNDLE_DIR if variant != "no-skill" else None,
            "normalized_skill_names": normalized_skill_names,
        },
    )
    return skill_root


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare four-layer image build contexts for base/harness/task/skill."
    )
    parser.add_argument("--tasks-root", type=Path, default=Path("skillsbench/tasks"))
    parser.add_argument("--tasks-no-skill-root", type=Path, default=Path("tasks-no-skill"))
    parser.add_argument("--tasks-skillos-root", type=Path, default=Path("tasks-skillos"))
    parser.add_argument(
        "--tasks-skillos-provider-swapped-root",
        type=Path,
        default=Path("tasks-skillos-provider-swapped"),
    )
    parser.add_argument("--images-root", type=Path, default=Path("images"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    task_out_root = args.images_root / "task"
    skill_out_root = args.images_root / "skill"
    reset_dir(task_out_root)
    reset_dir(skill_out_root)

    variant_roots = {
        "no-skill": args.tasks_no_skill_root,
        "raw-skill": args.tasks_root,
        "skillos": args.tasks_skillos_root,
        "skillos-provider-swapped": args.tasks_skillos_provider_swapped_root,
    }

    generated = {
        "task_layers": [],
        "skill_layers": [],
        "incomplete_tasks": [],
        "missing_variants": {},
    }

    inspections = inspect_task_root(args.tasks_root)

    for inspection in inspections:
        if not inspection.complete:
            generated["incomplete_tasks"].append(inspection.to_json_dict())
            continue

        src_task_dir = Path(inspection.root)
        task_id = inspection.task_id
        task_root = build_task_context(src_task_dir, task_out_root)
        generated["task_layers"].append(str(task_root))

        for variant in SKILL_VARIANTS:
            variant_task_dir = variant_roots[variant] / task_id
            if not variant_task_dir.exists():
                generated["missing_variants"].setdefault(variant, []).append(task_id)
                continue
            skill_root = build_skill_context(task_id, variant, variant_task_dir, skill_out_root)
            generated["skill_layers"].append(str(skill_root))

    write_json(args.images_root / "layer-index.json", generated)
    print(json.dumps(generated, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
