"""Regression checks for the explicit paper matrix and endpoint separation."""
import csv
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("prepare_experiment", ROOT / "tools/prepare_aiready_experiment.py")
PREP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PREP)
FROZEN = ROOT / "reproduction/frozen/data"


class PreparationTests(unittest.TestCase):
    def test_full_profile_matches_retained_cohort(self):
        script = 'source "$1"; printf "%s\\n" "$PAIRINGS_CSV" "$TASK_IDS" "$N_ATTEMPTS" "$SKILL_VARIANTS" "$SCORING_ENABLED"'
        values = subprocess.check_output(
            ["bash", "-c", script, "profile", str(ROOT / "experiment/profiles/aiready-v15-full.env")],
            cwd=ROOT, text=True).splitlines()
        pairs = PREP.load_pairings(ROOT / values[0])
        protocol = json.loads((FROZEN / "protocol.json").read_text())
        self.assertEqual(values[1].split(), protocol["tasks"])
        self.assertEqual(int(values[2]), protocol["repeats"])
        self.assertEqual(values[3], "aiready-skill-7.6")
        self.assertEqual(values[4], "0")
        self.assertEqual([row["config_key"] for row in pairs], protocol["config_order"])
        self.assertEqual(len(pairs) * len(values[1].split()) * int(values[2]), 4608)
        self.assertEqual(set(values[1].split()), set(PREP.load_tasks_from_docx(ROOT / "Benchmark_V15.docx")))

    def test_pairings_preserve_source_alias_and_exclude_unobserved_pairs(self):
        pairs = PREP.load_pairings(FROZEN / "pairings.csv")
        keys = {r["config_key"] for r in pairs}
        self.assertEqual(len(keys), 48)
        self.assertNotIn("claude-code__gpt55_or", keys)
        self.assertNotIn("claude-code__deepseek_v4pro_direct", keys)
        row = next(r for r in pairs if r["config_key"] == "claude-code__deepseek_v4_bailian")
        self.assertEqual(row["analysis_model_key"], "deepseek_v4pro_direct")
        counts = {h: sum(r["harness"] == h for r in pairs) for h in PREP.HARNESSES}
        self.assertEqual(counts, {"claude-code": 7, "codex": 7, "gemini-cli": 7,
                                  "hermes": 9, "kilo-code": 9, "openclaw": 9})

    def test_invalid_pairings_fail_before_generation(self):
        valid = PREP.load_pairings(FROZEN / "pairings.csv")[0]
        cases = [[], [valid, valid], [dict(valid, harness="unknown")],
                 [dict(valid, source_model_key="unknown")], [dict(valid, config_key="wrong")],
                 [dict(valid, analysis_model_key="")]]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pairings.csv"
            for rows in cases:
                with self.subTest(rows=rows):
                    with path.open("w", newline="") as stream:
                        writer = csv.DictWriter(stream, fieldnames=list(valid))
                        writer.writeheader()
                        writer.writerows(rows)
                    with self.assertRaises(ValueError):
                        PREP.load_pairings(path)

    def test_paper_endpoints_are_protocol_specific_placeholders(self):
        claude = PREP.agent_env_for("claude-code", "deepseek_v4_bailian")
        gemini = PREP.agent_env_for("gemini-cli", "gpt55_or")
        codex = PREP.agent_env_for("codex", "gpt55_or")
        self.assertEqual(claude["ANTHROPIC_BASE_URL"], "${AIREADY_DEEPSEEK_V4_BAILIAN_ANTHROPIC_BASE_URL}")
        self.assertEqual(gemini["GOOGLE_GEMINI_BASE_URL"], "${AIREADY_GPT55_OR_GEMINI_BASE_URL}")
        self.assertEqual(codex["OPENAI_API_KEY"], "${AIREADY_CODEX_GPT55_OR_API_KEY}")
        self.assertEqual(PREP.MODELS["gpt55_or"]["model_name"], "${AIREADY_GPT55_OR_NAME}")

    def test_generic_model_alias_remains_supported(self):
        env = PREP.agent_env_for("openclaw", "model_a")
        self.assertEqual(env["OPENAI_API_KEY"], "${AIREADY_OPENCLAW_MODEL_A_API_KEY}")
        self.assertEqual(PREP.MODELS["model_a"]["model_name"], "${AIREADY_MODEL_A_NAME}")

    def test_paper_profile_rejects_generic_scoring_before_execution(self):
        for command in ("score-aggregate", "all-with-scoring"):
            with self.subTest(command=command):
                result = subprocess.run([
                    "bash", str(ROOT / "experiment/bin/aiready_workflow.sh"), command,
                    "--profile", str(ROOT / "experiment/profiles/aiready-v15-full.env"),
                ], cwd=ROOT, capture_output=True, text=True)
                self.assertEqual(result.returncode, 2)
                self.assertIn("Generic scoring is disabled", result.stderr)


if __name__ == "__main__":
    unittest.main()
