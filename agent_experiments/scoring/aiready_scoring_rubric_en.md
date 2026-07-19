# AIREADY Experimental Plan Evaluation Dimensions

## Physical Implementability

Physical implementability evaluates whether the proposed experimental plan is consistent with basic physical device parameters, chemical procedures, and automation-system engineering constraints, and whether it can plausibly operate under real automated-laboratory conditions. This dimension focuses on whether the reactions, materials, energy input, temperature, duration, pressure, potential, illumination, atmosphere, solvents, containers, and related conditions are reasonable, and whether the plan obviously violates thermodynamic, kinetic, safety, or equipment-capability boundaries.

## Experimental Workflow Completeness

Experimental workflow completeness evaluates whether the plan covers the complete experimental chain required by the task, from material preparation to result acquisition, rather than describing only an isolated step. This dimension focuses on whether the experiment has a continuous and clear process logic from beginning to end, whether the input, processing, and output relationships between steps are appropriate, and whether the plan forms an understandable, executable, and traceable experimental workflow.

## Experimental Design Rationality

Experimental design rationality evaluates whether the plan is logically designed around the explicit scientific question and target metrics in the task, rather than arbitrarily piling up materials, conditions, and tests. This dimension focuses on whether the material-system selection, reaction-condition setup, control experiments, hypothesis validation, performance comparison, and exclusion of confounding factors serve the core scientific objective. A reasonable design should show exploratory value and interpretability, obtain discriminative data from a limited number of experiments, and provide clear guidance for the next optimization round.

## 0-100 Scoring Scale

- 90-100: Excellent for this dimension. The plan is highly reliable and has only very minor flaws.
- 80-89: Strong overall. A few issues exist but they do not affect the core judgment.
- 70-79: Basically acceptable, but there are visible gaps or several weaknesses.
- 60-69: Barely acceptable. The core idea exists, but the plan requires obvious revision.
- 40-59: Weak for this dimension. Only part of the plan is usable.
- 20-39: Mostly unsatisfactory, with severe omissions or obvious unreasonable aspects.
- 1-19: Almost unusable, with only minimal relevant content.
- 0: No relevant content, invalid JSON, completely unrelated, impossible to judge, or fundamentally wrong for this dimension.
