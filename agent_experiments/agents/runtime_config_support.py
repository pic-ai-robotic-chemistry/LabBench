from __future__ import annotations

import shlex
from pathlib import PurePosixPath


RUNTIME_CONFIG_ROOT = PurePosixPath("/runtime-configs")


def mounted_runtime_config_dir(harness: str) -> PurePosixPath:
    return RUNTIME_CONFIG_ROOT / harness


def quote_path(path: str | PurePosixPath) -> str:
    return shlex.quote(str(path))


def copy_file_if_exists(source: str | PurePosixPath, target: str | PurePosixPath) -> str:
    source_q = quote_path(source)
    target_q = quote_path(target)
    parent_q = quote_path(PurePosixPath(str(target)).parent)
    return (
        f"if [ -f {source_q} ]; then "
        f"mkdir -p {parent_q} && cp {source_q} {target_q}; "
        "fi"
    )


def copy_dir_if_exists(source: str | PurePosixPath, target: str | PurePosixPath) -> str:
    source_q = quote_path(source)
    target_q = quote_path(target)
    return (
        f"if [ -d {source_q} ]; then "
        f"mkdir -p {target_q} && cp -R {source_q}/. {target_q}/; "
        "fi"
    )


def append_log_line(target: str | PurePosixPath, message: str) -> str:
    target_q = quote_path(target)
    parent_q = quote_path(PurePosixPath(str(target)).parent)
    message_q = shlex.quote(message)
    return f"mkdir -p {parent_q} && printf '%s\\n' {message_q} >> {target_q}"


def build_aichem_token_config_patch_command() -> str:
    """Remove stale hard-coded AICHEM token fallbacks from mounted skill copies."""

    script = r'''
import json
import re
from pathlib import Path

roots = [Path(raw) for raw in ("/opt", "/root", "/home", "/tmp", "/workspace") if Path(raw).exists()]
target_suffix = "/lab-operation/scripts/config.py"
pattern = re.compile(
    r"os\.environ\.get\(\s*['\"]AICHEM_APP_TOKEN['\"]\s*,\s*['\"]Bearer [^'\"]+['\"]\s*\)"
)
replacement = 'os.environ.get("AICHEM_APP_TOKEN", "")'
matched = []
patched = []
errors = []

for root in roots:
    try:
        candidates = root.glob("**/lab-operation/scripts/config.py")
        for path in candidates:
            if not path.is_file() or not path.as_posix().endswith(target_suffix):
                continue
            matched.append(str(path))
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
                new_text = pattern.sub(replacement, text)
                if new_text != text:
                    path.write_text(new_text, encoding="utf-8")
                    patched.append(str(path))
            except Exception as exc:
                errors.append({"path": str(path), "error": repr(exc)})
        for pyc_path in root.glob("**/lab-operation/scripts/__pycache__/config*.pyc"):
            try:
                pyc_path.unlink()
                patched.append(str(pyc_path))
            except Exception as exc:
                errors.append({"path": str(pyc_path), "error": repr(exc)})
    except Exception as exc:
        errors.append({"path": str(root), "error": repr(exc)})

out = Path("/logs/agent/setup/aichem-token-config-patch.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(
    json.dumps(
        {
            "matched_count": len(matched),
            "patched_count": len(patched),
            "matched": matched,
            "patched": patched,
            "errors": errors,
        },
        indent=2,
        ensure_ascii=False,
    )
    + "\n",
    encoding="utf-8",
)
'''
    return f"python3 -c {shlex.quote(script)}"
