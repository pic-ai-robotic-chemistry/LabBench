# 303 Intelligent Scientist Laboratory Plan Constraint Checklist v2

> R1 evaluates only whether the final JSON plan itself can be parsed/accepted by the physical devices and the system. Scientific completeness, scientific validity, runtime token/session, real task state, and CoT process traces do not enter the R1 main score.
> Within the R1 scoring scope, any violation of an item marked **[H]** in this file means "physically non-executable"; violation of **[M]** will cause workstation rejection or invalid data; violation of **[L]** is usually executable but is a minor device/schema-level defect.
> v2 changes: added the invalid-submission / placeholder pre-gate; clarified that file-parameter workstations only require checking the required file field and OBS URL, not expanding file-internal parameters.

---

## 0 · Output Format Convention

The plan must be a single JSON object. Either of the following two shapes is acceptable, because both appear in SKILL.md examples:

```jsonc
// Shape A (chemistry-experiment-workstation SKILL.md §5 example)
{ "实验名称": "...", "steps": [ ... ], "unknown_steps": null }

// Shape B (workflow-generator schema)
{ "plan_name": "...", "experiment_steps": { "steps": [ ... ], "unknown_steps": null } }
```

Every step must contain five fields; missing any one of them is [H]:

| Field | Type | Description |
|---|---|---|
| `step_number` | int | Consecutive from 1 |
| `workstation` | string | Must exactly match the Chinese name in "§2 Workstation Whitelist" |
| `id` | int / string | Must exactly match the workstation code in the whitelist |
| `operation` | string | Must hit a legal operation for that workstation in "§3 Workstation I/O Matrix" |
| `parameters` | object | Required items must not be missing; non-schema fields should not appear |

Hard constraint on special field format:
- **`开盖的瓶号` must be an array of objects**. Positive example: `[{"瓶号":"1"},{"瓶号":"2"}]`; a plain numeric array such as `[1,2]` is directly [H].

---

## 0.5 · Invalid Submission / Placeholder Pre-Gate

> This section only identifies placeholder plans that are "JSON-parseable but not an evaluable experimental workflow", preventing a one-step `test_plan` from receiving near-passing R1 credit merely because its schema is parseable.

- **V0.1 [H]** `steps` is empty, missing, or no legal step can be located: total score = 0.
- **V0.2 [H]** Total step count < 3 and every step is only a transport/placeholder step such as material retrieval, container retrieval, standing, material placement, plate recycling, or container transfer that does not change sample state and does not produce reaction/testing/characterization: invalid submission, total score capped at 25.
- **V0.3 [H]** The final JSON explicitly contains placeholder markers such as `TODO`, `placeholder`, `test_plan`, `占位`, `待补充`, or `示例`, and the main process does not form a real experimental chain: invalid submission, total score capped at 25.
- **V0.4 [M]** The step count is very small (usually < 4). Even if there is one real device operation, if it is insufficient to form the experimental workflow required by the problem, it may be treated as a "severely incomplete workflow" with total score capped at 40. Note: whether the plan answers the problem is judged in detail by R2; this rule only prevents obvious placeholder plans from receiving high scores by relying on schema compliance.
- **V0.5 [H]** Total step count < 3 and any of the following is also true: `plan_name`/top-level fields contain `test_plan` or placeholder markers; the only/main step uses a non-whitelisted workstation; or the only/main step is merely material retrieval/placement/transfer placeholder action. This is not a "low-quality experimental chain"; it is **failure to submit an executable experimental chain**, and R1 total score should be 0.
- If the problem itself only requires a single transport or single testing action and the final JSON exactly matches the problem, this pre-gate is not triggered.

---

## 0.6 · R1 Absolute Score-Band Anchors

> This section standardizes absolute score scales across reviewers. First deduct under D1-D5, then apply this section's bands and ceilings. If this section conflicts with a stricter hard constraint, take the lower ceiling.

- **A0 placeholder submission**: if V0.5 is triggered, R1 = 0; if V0.2/V0.3 is triggered but there are a few legal real device actions, R1 is usually 1-25.
- **A1 large-scale old workstations / non-whitelist**: if more than 70% of steps use non-whitelisted workstations, or all key reaction/testing/characterization steps are not current whitelist triplets, R1 is capped at 20; if almost the entire process cannot be routed by workflow-generator, R1 is usually 0-15.
- **A2 small number of naming/operation errors**: only if 1-2 main-process steps contain a non-whitelisted name, wrong id, or wrong operation while the rest of the main chain is broadly parseable, use the "maximum total score 40" ceiling. Do not leniently give 30-40 to plans with large-scale old workstations.
- **A3 all triplets legal but I/O ledger incomplete**: if `workstation/id/operation` are all legal, but testing-workstation input container, lid state, or sample state cannot be sufficiently traced from preceding legal outputs, R1 usually falls in 55-70; if multiple key testing inputs cannot be traced, R1 is no higher than 55; if only terminal placement object or minor state recording is unclear, R1 may be 65-75.
- **A4 all triplets legal and main I/O chain closed**: R1 should enter 80+ only when key reaction, characterization, testing, and file-parameter steps are parseable and the main I/O chain is closed. If operation union, I/O, and file URL prechecks are not explicitly performed, R1 must not exceed 70.

---

## 1 · Top-Level Process Hard Constraints (violation of any item is [H])

### T1 Experiment Start/End
- **T1.1 [H]** The first step of the experiment must be a "material configuration" workstation for synthesis scenarios; testing-only scenarios are exempt.
- **T1.2 [H]** The last step of the experiment must be `容器置放平台_V1` with operation `物料放置`; testing-only scenarios are exempt.

### T2 Container Consistency
- **T2.1 [H]** Across the whole experimental process, `容器类型` in every step must remain consistent. Reasonable switching is allowed only when the Workstation I/O Matrix explicitly declares the input/output container conversion, such as V2 multi-channel weighing hopper -> 10ml pressure-resistant reaction tube, post-reaction processing 10ml pressure-resistant reaction tube -> 96-well plastic plate, or dual-station electrochemical workstation sample vial -> sample vial / vial / LC vial. Any container jump not permitted by the workstation matrix is [H].

### T3 Monotonic Container Count
- **T3.1 [H]** Scanning in increasing `step_number` order, the number of elements in the `容器编号` set may only stay the same or decrease; it must not increase.
- **T3.2 [H]** `容器编号` for the same physical sample trajectory must not change mid-process. If a change is needed, there must be an explicit "transfer operation" step connecting the two.

### T4 Lid State Machine
- **T4.1 [H]** The whole process must maintain `lid_status ∈ {open, closed}`. When a workstation's input constraint declares "must be with lid / must be without lid", the preceding step's output state must match.
- **T4.2 [H]** **Only 移液平台_1ml_V1, 移液平台_1ml_V2, 移液平台_5ml_V2, and 液体倾倒工作站_V1 have lid opening/closing capability**. All other workstations have no lid opening/closing function. When lid state must change, an explicit `开盖` or `关盖` step must be inserted.
- **T4.3 [L]** 96-well plastic/quartz plates are lidless by default and do not require an opening step.

### T5 One Bottle, One Liquid
- **T5.1 [H]** In liquid-handling `加液_物料绑定`, the same stock-solution bottle number (e.g. stock-solution bottle 1, bottle 2) may bind only one ingredient name throughout the process. The same substance name appearing in different stock-solution bottle numbers is also a violation.
- **T5.2 [H]** Stock-solution bottle number ordering remains fixed throughout the experiment.

### T6 Workstation Legality
- **T6.1 [H]** All workstation names, IDs, and operation names appearing in the plan must be inside the §2 / §3 whitelist. Any hallucinated workstation name (e.g. `光催化工作站_V3`), wrong ID, or wrong operation name is directly [H].
- **T6.1a [H]** Whitelist matching is character-level exact string matching. During review, do not trim strings, remove a `303` prefix, fill in `_V1/_V2`, map a display name to a system name, or infer a Chinese name from an English name or common sense. Any non-identical `workstation` is treated as a nonexistent workstation name; a correct `id` cannot offset a wrong name.
- **T6.2 [H]** The SKILL list reviewed during experiment generation and the SKILL list used should be reflected in the plan or sibling output (SKILL.md §2 (2) print requirement). Missing this is process-incomplete [M].

### T7 Review CoT (not part of R1 final JSON main score)
- **T7.1 [META]** CHECKPOINT 1 (constraint validation table) and CHECKPOINT 2 (modification record) are agent process traces. They may be used for log quality or process audit; do not deduct R1 physical-executability points because the final JSON lacks CoT.

---

## 2 · Workstation Whitelist (45 stations, with codes)

> **Any workstation name + id appearing in a plan must exactly match this table.** Both the name and id must be correct at the same time; either one wrong is [H].

### 2.1 Synthesis Module (28 stations)

| Chinese Name | Workstation ID | English Name |
|---|---|---|
| 常规物料站 | 1427568512205824 | General_Material_Station_V1 |
| 耐热瓶物料站 | 1931561198552064 | Heat_Resistant_Material_Station |
| 容器置放平台_V1 | 1421325849887744 | Container_storaging_Station_V1 |
| 孔板置放平台_V1 | 2112666776765440 | Plate_storaging_Station_V1 |
| 智能光催容器中转平台_V1 | 2103518483186688 | Intelligent_Photocatalysis_Container_Transfer_Station_V1 |
| 移液平台_1ml_V1 | 1418510906065920 | Liquid_Handling_Station_1ml_V1 |
| 移液平台_1ml_V2 | 2002186824385539 | Liquid_Handling_Station_1ml_V2 |
| 移液平台_5ml_V1 | 1435269745574912 | Liquid_Handling_Station_5ml_V1 |
| 移液平台_5ml_V2 | 2041147814970368 | Liquid_Handling_Station_5ml_V2 |
| 移液平台_5ml_V3 | 2350309661279232 | Liquid_Handling_Station_5ml_V3 |
| 移液平台四通道_V1 | 2013400103584768 | Liquid_Handling_Station_4Channel_V1 |
| 超声移液平台_V1 | 2061540603593728 | Ultrasonic_Liquid_Handling_Workstation_V1 |
| 液体倾倒工作站_V1 | 2342310067209216 | Liquid_Pouring_Workstation_V1 |
| 批量加液工作站_V1 | 2359193660589057 | Cleaning_and_Dispensing_Workstation_V1 |
| 单通道固体称量工作站_V1 | 1396669754016768 | Single_Channel_Solid_Weighing_Workstation_V1 |
| 多通道固体称量工作站_V1 | 1834679312417792 | Multi_Channel_Solid_Weighing_Workstation_V1 |
| 多通道固体称量工作站_V2 | 2347821874414592 | Multi_Channel_Solid_Weighing_Workstation_V2 |
| 固体样品转移工作站_V1 | 2347800490378240 | Solid_Sample_Transfer_Workstation_V1 |
| 加热磁力搅拌工作站_V1 | 2270587971011585 | Heating_Magnetic_Stirring_Workstation_V1 |
| 常温磁力搅拌工作站_V1 | 2114846484726785 | Room_Temperture_Magnetic_Stirrer_Workstation_V1 |
| 谱学磁力搅拌工作站_V1 | 1656241422599168 | Spectroscopy_Magnetic_Stirrer_Workstation_V1 |
| 超声分散仪_V1 | 1526864804185088 | Ultrasonic_Disperser_V1 |
| 超声分散仪_V2 | 1213123578463232 | Ultrasonic_Disperser_V2 |
| 离心机_V1 | 1832680407172096 | Centrifuge_V1 |
| 烘干机_V1 | 1213184425559040 | Drying_Oven_V1 |
| 马弗炉_V1 | 2030562790507520 | Muffle_Furnace_V1 |
| 冷却工作站_V1 | 2060999106102272 | Cooling_Workstation_V1 |
| 纯化工作站_V1 | 1327807622448128 | Purification_Workstation_V1 |

### 2.2 Reaction & Testing Module (5 stations)

| Chinese Name | Workstation ID | English Name |
|---|---|---|
| 光催化工作站_V1 | 1690656219890688 | Photocatalysis_Workstation_V1 |
| 光催化工作站_V2 | 2063934097720320 | Photocatalysis_Workstation_V2 |
| 双工位电化学工作站_V2 | 1390252863751168 | Dual_Station_Electrochemical_Workstation_V2 |
| 高温高压微反应平台_V1 | 2109722046989319 | High_Temperature_High_Pressure_Microreaction_Platform_V1 |
| 反应后处理平台_V1 | 2347878269223936 | Post_Reaction_Processing_Platform_V1 |

### 2.3 Characterization Module (12 stations)

| Chinese Name | Workstation ID | English Name |
|---|---|---|
| 气相色谱仪_V1 | 1710453843264512 | Gas_Chromatograph_V1 |
| 液相色谱仪_V1 | 1705412049896448 | Liquid_Chromatograph_V1 |
| X射线衍射仪_V1 | 1664870018155520 | XRD_V1 |
| 红外光谱仪_V1 | 1656282895188992 | Infrared_Spectrometer_V1 |
| 荧光光谱仪_V1 | 1653927312688128 | Fluorescence_Spectrometer_V1 |
| 紫外可见光谱仪_V1 | 1664783667397632 | UV–Vis_Spectrometer_V1 |
| 酶标仪_V1 | 1696728620696576 | Microplate_Reader_V1 |
| 谱学容器中转平台_V1 | 1654567694238720 | Spectroscopy_Container_Transfer_Station_V1 |
| 接触角_张力仪_V1 | 1557192287519744 | Interfacial_Wettability_and_Mass_Transfer_Characterization_Workstation |
| 气液传质_高速摄像_V1 | 1495725650150400 | Gas_Liquid_Mass_Transfer_High_Speed_Camera_V1 |
| 光照压膜工作站_V1 | 2081117937501185 | LED_Illumination_and_Membrane_Clamping_Workstation_V1 |
| 暗箱拍摄工作站_V1 | 2061168712647680 | Darkbox_Imaging_Workstation_V1 |

---

## 3 · Workstation I/O Matrix (legal operation + input/output triples for each station)

> Each row = one legal operation. Triple: (container type, container state, sample state). "Must be with lid / must be without lid" are both strong constraints.
>
> **Multi-operation union rule [H]**: the same workstation may appear in multiple rows in this matrix, and each row is a legal operation for that workstation. Reviewers or parsers must take the union of all operations under the same workstation; do not read only the first row, only the last row, or let later operations overwrite earlier operations. If an already listed operation is misjudged as illegal due to overwriting, that is a review error and must not be used as a deduction basis.
>
> Quick checks:
> - Legal operations for `移液平台_1ml_V1` = `开盖` / `移液到96位孔板` / `关盖` / `加液_物料绑定`.
> - Legal operations for `智能光催容器中转平台_V1` = `光催化压膜转运至中转位_96位孔板` / `平台联动孔板拿取_96位孔板` / `平台联动孔板放置_96位孔板`.
> - Legal operations for `移液平台_5ml_V2` = `开盖` / `关盖` / `纯移液`.
> - Legal operations for `双工位电化学工作站_V2` = `电化学检测` / `制备并转移碳纸样品`.

### Synthesis Module

| Workstation | operation | Input (type/state/sample) | Output (type/state/sample) | Key process constraints |
|---|---|---|---|---|
| 常规物料站 | 物料拿取 | Container type: 进样瓶 or 西林瓶; state: with lid; sample state: must have no sample state | Container type: same as input; state: same as input; sample state: must have no sample state | If output is 进样瓶, subsequent step must connect to liquid-handling platform, multi-channel solid weighing, or single-channel solid weighing workstation |
| 耐热瓶物料站 | 容器拿取 | Container type: 50ml耐热瓶; state: with lid; sample state: must have no sample state | Container type: same as input; state: same as input; sample state: must have no sample state | If output is heat-resistant bottle, subsequent step must connect to liquid-handling platform, multi-channel solid weighing, or single-channel solid weighing workstation |
| 容器置放平台_V1 | 静置 | Container type: 进样瓶 or 50ml耐热瓶 or 西林瓶; state: unrestricted; sample state: unrestricted | Container type/state/sample state unchanged | T1.2 exit workstation |
| 容器置放平台_V1 | 物料放置 | Container type: 进样瓶 or 50ml耐热瓶 or 西林瓶; state: unrestricted; sample state: unrestricted | Container type/state/sample state unchanged | T1.2 exit workstation |
| 孔板置放平台_V1 | 回收96孔板和氢气膜 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 孔板置放平台_V1 | 回收96孔板 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 智能光催容器中转平台_V1 | 光催化压膜转运至中转位_96位孔板 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | Only applies when the previous workstation is `光照压膜工作站` and operation is `氢气检测膜压膜后光照流程`, transferring a 96-well plate to the intelligent photocatalysis transfer position |
| 智能光催容器中转平台_V1 | 平台联动孔板拿取_96位孔板 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | Only applies when a 96-well plate is transferred from an internal intelligent-photocatalysis-platform workstation to another device workstation |
| 智能光催容器中转平台_V1 | 平台联动孔板放置_96位孔板 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | Only applies when a 96-well plate is transferred from another device workstation to an internal intelligent-photocatalysis-platform workstation |
| 移液平台_1ml_V1 | 开盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be with lid; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 移液平台_1ml_V1 | 移液到96位孔板 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 移液平台_1ml_V1 | 关盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 移液平台_1ml_V1 | 加液_物料绑定 | Container type: 进样瓶 or 西林瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state: pure liquid or suspension | Up to 8 solutions; maximum single pipetting volume 1 mL; cumulative volume per solution ≤3 mL |
| 移液平台_1ml_V2 | 开盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be with lid; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 移液平台_1ml_V2 | 关盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 移液平台_1ml_V2 | 加液_物料绑定 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state: pure liquid or suspension | Up to 16 solutions; maximum single pipetting volume 1 mL; cumulative volume per solution ≤3 mL |
| 移液平台_5ml_V1 | 加液_物料绑定 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state: pure liquid or suspension | Up to 6 solutions; maximum single pipetting volume 5 mL; cumulative volume per solution ≤30 mL |
| 移液平台_5ml_V2 | 开盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be with lid; sample state: unrestricted | Container type unchanged; state: lidless; sample state unchanged | — |
| 移液平台_5ml_V2 | 关盖 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 移液平台_5ml_V2 | 纯移液 | Container type: 进样瓶 and 50ml耐热瓶; state: must be lidless; sample state: unrestricted | Container type unchanged; state: lidless; sample state: pure liquid or suspension | Bottle-to-bottle liquid transfer only; maximum single pipetting volume 5 mL |
| 移液平台_5ml_V3 | 反应管加样 | Container type: 10ml耐压反应管; state: lidless; sample state: unrestricted | Container type unchanged; state: lidless; sample state: pure liquid or suspension | Up to 8 solutions; maximum single pipetting volume 1 mL; cumulative volume per solution ≤3 mL |
| 移液平台四通道_V1 | 液体加样 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: unrestricted | Container type unchanged; state: must be lidless; sample state: pure liquid or suspension | Add 1-8 liquids to the container according to imported template-file parameters |
| 超声移液平台_V1 | 超声加液流程 | Container type: 96位塑料孔板 or 96位石英孔板; state: unrestricted; sample state: unrestricted | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 超声移液平台_V1 | 开启超声 | Container type: 96位塑料孔板 or 96位石英孔板; state: unrestricted; sample state: unrestricted | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 液体倾倒工作站_V1 | 开盖 | Container type: 进样瓶; state: with lid; sample state: unrestricted | Container type unchanged; state: lidless; sample state unchanged | — |
| 液体倾倒工作站_V1 | 关盖 | Container type: 进样瓶; state: lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 液体倾倒工作站_V1 | 液体倾倒 | Container type: 进样瓶; state: lidless; sample state: upper supernatant and lower solid precipitate | Container type unchanged; state: lidless; sample state: solid | — |
| 批量加液工作站_V1 | 批量加液流程 | Container type: 进样瓶 or 50ml耐热瓶; state: lidless; sample state: unrestricted | Container type unchanged; state: with lid; sample state unchanged | — |
| 单通道固体称量工作站_V1 | 固体进样 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: must contain no solution | Container type unchanged; state: lidless; sample state: solid | Bottles already containing liquid cannot enter |
| 多通道固体称量工作站_V1 | 固体进样-文件传参-机器人 | Container type: 进样瓶 or 西林瓶 or 50ml耐热瓶; state: must be lidless; sample state: must contain no solution | Container type unchanged; state: must be lidless; sample state: powder | Up to 30 solids |
| 多通道固体称量工作站_V2 | 固体称量 | Container type: 料斗; state: lidless; sample state: solid | Container type: 10ml耐压反应管; state: lidless; sample state: solid | Up to 10 solids; prerequisite must be 固体样品转移工作站_V1 |
| 固体样品转移工作站_V1 | 固体样品转移 | Container type: 96位塑料孔板 or 50ml耐热瓶 or 西林瓶 or 进样瓶; state: lidless; sample state: solid | Container type: 料斗; state: lidless; sample state: solid | Prerequisite for V2 weighing |
| 加热磁力搅拌工作站_V1 | 加热磁力搅拌全流程 | Container type: 进样瓶 or 50ml耐热瓶; state: with lid; sample state: pure liquid or suspension | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 常温磁力搅拌工作站_V1 | 开始搅拌 | Container type: 进样瓶 or 50ml耐热瓶; state: unrestricted; sample state: pure liquid or suspension | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 谱学磁力搅拌工作站_V1 | 样品架放置-夹具识别 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | XRD/IR prerequisite |
| 超声分散仪_V1 | 超声清洗 | Container type: 进样瓶 or 50ml耐热瓶; state: unrestricted; sample state: pure liquid or suspension | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 超声分散仪_V2 | 超声清洗 | Container type: 进样瓶 or 50ml耐热瓶 or 西林瓶; state: unrestricted; sample state: pure liquid or suspension | Container type/state unchanged; sample state: uniformly dispersed suspension or pure liquid | — |
| 离心机_V1 | 离心-复位机制 | Container type: 进样瓶; state: must be with lid and count must be an even number between 1 and 10; sample state: pure liquid or suspension | Container type unchanged; state: must be with lid; sample state: upper supernatant and lower solid precipitate | Odd count is [H]; not closing lid is [H] |
| 烘干机_V1 | 烘干主流程 | Container type: 进样瓶 or 50ml耐热瓶; state: unrestricted; sample state: unrestricted | Container type/state/sample state unchanged | — |
| 马弗炉_V1 | 马弗炉加热流程_96石英孔板 | Container type: 96位石英孔板; state: lidless; sample state: unrestricted | Container type unchanged; state: lidless; sample state unchanged | Accepts only quartz plates |
| 冷却工作站_V1 | 冷却流程 | Container type: 96位石英孔板; state: lidless; sample state: unrestricted | Container type unchanged; state: lidless; sample state unchanged | Accepts only quartz plates |
| 纯化工作站_V1 | 纯化离心 | Container type: 进样瓶 or 留样瓶; state: must be with lid and count must be an even number between 1 and 10; sample state: pure liquid or suspension | Container type unchanged; state: must be with lid; sample state: suspension or pure liquid or solid | Odd count / not closing lid is [H] |

### Reaction & Testing Module

| Workstation | operation | Input (type/state/sample) | Output (type/state/sample) | Key process constraints |
|---|---|---|---|---|
| 光催化工作站_V1 | 光催化流程 | Container type: 西林瓶; state: must be lidless; sample state: unrestricted | Container type: 西林瓶; state: must be lidless; sample state unchanged | Maximum 20 vials; 4 lamp rows independently controlled |
| 光催化工作站_V2 | 光催化流程 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | Maximum 1 plate; must upload photocatalysis file |
| 双工位电化学工作站_V2 | 电化学检测 | Container type: 进样瓶; state: must be lidless; sample state: pure liquid or suspension >4 mL | Container type: 进样瓶 (required), 西林瓶 or 色谱进样瓶 (optional, selected if retention sample is needed); state: lidless; sample state: pure liquid | Input volume ≤4 mL is [H]; template name must be filled; only one testing template may be selected |
| 双工位电化学工作站_V2 | 制备并转移碳纸样品 | Container type: 进样瓶; state: must be lidless; sample state: pure liquid or suspension | Container type: 碳纸架; state: must be lidless; sample state: solid loaded on carbon paper | — |
| 高温高压微反应平台_V1 | 反应釜微反应 | Container type: 10ml耐压反应管; state: lidless; sample state: unrestricted | Container type/state unchanged; sample state: unrestricted | Temperature upper limit 200 ℃, pressure upper limit 5 MPa, per-bottle liquid volume ≤6 mL, at most 4 reaction tubes, stirring gear 1-5 |
| 反应后处理平台_V1 | 后处理 | Container type: 10ml耐压反应管; state: lidless; sample state: suspension | Container type: 液相54孔板 or 96位塑料孔板 or 气相54孔板; state unchanged; sample state: pure liquid | Outputs only liquid phase; solid phase is discarded by filtration; at most 4 reaction tubes |

### Characterization Module

| Workstation | operation | Input (type/state/sample) | Output (type/state/sample) | Key process constraints |
|---|---|---|---|---|
| 气相色谱仪_V1 | 气相分析 | Container type: 气相54孔板; state: lidless; sample state: pure liquid | Container type: 气相54孔板; state: lidless; sample state unchanged | Prerequisite workstation: requires spectroscopy placement; BatchFile + new method file must be OBS URLs returned by `upload2obs.py` |
| 液相色谱仪_V1 | 液相分析 | Container type: 液相54孔板; state: lidless; sample state: pure liquid | Container type: 液相54孔板; state: lidless; sample state unchanged | Must be preceded by 谱学容器中转平台_V1 |
| X射线衍射仪_V1 | XRD滴液检测全流程 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | Before entering this work, there must be spectroscopy placement and spectroscopy magnetic stirring; test solution volume ≥ 4.0 mL |
| 红外光谱仪_V1 | 谱学红外流程-夹具识别 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | Before entering this work, there must be spectroscopy placement and spectroscopy magnetic stirring; test solution must be at least 4 mL |
| 荧光光谱仪_V1 | 荧光光谱进样绘图 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | Before entering this work, there must be a spectroscopy placement workstation |
| 紫外可见光谱仪_V1 | 紫外光谱进样绘图 | Container type: 进样瓶 or 50ml耐热瓶; state: must be lidless; sample state: pure liquid | Container type unchanged; state: must be lidless; sample state unchanged | Before entering this work, there must be a spectroscopy placement workstation |
| 酶标仪_V1 | 酶标仪303谱学流程 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: pure liquid | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 谱学容器中转平台_V1 | 容器中转 | Container type: 进样瓶 or 液相54孔板 or 50ml耐热瓶 or 西林瓶 or 96位石英孔板 or 96位塑料孔板 or 气相54孔板; state: must be lidless; sample state: pure liquid or suspension | Container type unchanged; state: must be lidless; sample state unchanged | 色谱进样瓶 is not in the legal input list |
| 接触角_张力仪_V1 | 接触角-张力仪实验-迭代 | Container type: 测试架; state: unrestricted; sample state: solid loaded on carbon paper | Container type unchanged; state: must be lidless; sample state unchanged | — |
| 气液传质_高速摄像_V1 | 多样品测试-无活化 | Container type: 测试架; state: unrestricted; sample state: solid loaded on carbon paper | Container type/state/sample state unchanged | — |
| 光照压膜工作站_V1 | 氢气检测膜压膜后光照流程 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: pure liquid or suspension | Container type: 96位塑料孔板; state: must be lidless; sample state unchanged | Output is forced to 96位塑料孔板 |
| 光照压膜工作站_V1 | 不压膜仅光照 | Container type: 96位塑料孔板 or 96位石英孔板; state: must be lidless; sample state: pure liquid or suspension | Container type: 96位塑料孔板; state: must be lidless; sample state unchanged | Output is forced to 96位塑料孔板 |
| 暗箱拍摄工作站_V1 | 暗箱光照流程 | Container type: 96位塑料孔板 or 96位石英孔板; state: lidless; sample state: pure liquid or suspension | Container type unchanged; state: lidless; sample state unchanged | — |

---

## 4 · Parameter Boundary Table (key numeric lower/upper limits)

> Any boundary violation is [H] (device hardware hard limit).

### 高温高压微反应平台_V1
- Temperature ∈ [25, 200] ℃ [H]
- Reaction pressure ≤ 5 MPa [H]
- Per-bottle liquid volume ≤ 6 mL [H]
- Reaction-tube count ∈ [0, 4] [H]
- Stirring gear ∈ [1, 5] [H]
- Reaction time is a positive integer (min) [M]
- Required fields: flowmeter flow rate / airtightness time & pressure / gas replacement times & pressure & flow rate & gas type / single replacement time / temperature / stirring-speed gear / reaction time / lid-opening temperature / reaction pressure / **reaction-tube-number field must be filled twice** (as in original schema)

### 双工位电化学工作站_V2 · 电化学检测
- Container count ∈ [0, 10] (进样瓶) [H]
- Pipette drop-casting interval ∈ (0, 600] seconds [H]
- Pipette drop-casting count ∈ (0, 20] [H]
- Carbon-paper drying temperature ∈ (0, 80] ℃ [H]
- Catalyst droplet volume ∈ (29, 100] μL [H]
- Electrolyte addition amount ∈ (9, 50] mL [H]
- Carbon-paper drying time ∈ (0, 480] min [H]
- Reaction-cell washing count ∈ (0, 5] [H]
- Electrolytic-cell magnetic stirring speed ∈ (0, 2500] rpm [H]
- Gas purging duration ∈ (0, 100] min [H]
- Flow-rate setting ∈ (0, 10] mL/min [H]
- Select electrolytic cell ∈ {1=single cell, 2=H-type cell} [H]
- Carbon-paper drying setting ∈ {heat, naturalDry} [H]
- Gas purging state ∈ {none, one, two, both} [H]
- Carbon-paper type ∈ {hydrophilicity, hydrophobicity} [H]
- Vial type ∈ {closedCapScrewBottle, uncapScrewBottle, uncapFlatMouthedBottle} [H]
- `电化学任务N`, where N ∈ {一...十}, must be consecutive starting from "一"; numbering cannot be skipped [H]
- When `废液移液设置 = yes`, `留样信息列表` must contain: `吸取废液体积`, `滴液容器类型`, `搅拌混匀`, `移液清洗废液瓶次数`, and `吸取原液瓶N号液体体积` (N starts from 1 and proceeds in order according to the actual number of bottles used) [H]
- Testing-template field is an array and may contain only **one** object `{模板编号, 模板名称}`; template name is required [H]
- Legal testing templates (only these 11):

| 模板名称 | 模板编号 |
|---|---|
| 智能体EOR实验测试模板 | 1509591942430720 |
| 智能数据调试 | 1549499770798080 |
| 智能体EOR_2 | 1571299393601536 |
| PBA离子电导率测试模版 | 1339275293851648 |
| LDH ZZY | 2164305671290880 |
| OER test | 1871543936286720 |
| HER test | 2468875037704192 |
| UOR test | 2468876630032384 |
| EOR test | 2468878003372032 |
| CV test | 2468886548086784 |
| EIS test | 2468890396983296 |

### 光催化工作站_V1
- Container type = 西林瓶, count ∈ [1, 20] [H]
- Each of 4 lamp rows independently ∈ {0=off, 1=on} [H]
- Time ∈ [1, 2880] min [H]

### 光催化工作站_V2
- Container type = 96位塑料孔板 or 96位石英孔板, count ∈ [0, 1] [H]
- Required: plate number / 光催化文件 [H]
- `光催化文件` is a parameter marked `类型 = file` and `是否必填 = 是` in the SKILL parameter table. R1 only checks whether this field exists and whether it is an OBS URL retrievable by the system; it does not require the final JSON to separately expand file-internal illumination time, illumination level, well-position program, or other process parameters.

### 多通道固体称量工作站_V1
- Up to 30 solids [H]
- Maximum containers: 20 进样瓶 / 10 西林瓶 / 10 50ml耐热瓶 [H]
- Required: 容器类型 / 容器数量 / 容器编号 / 上传文件 [H]
- `上传文件` is a required `file` parameter in the SKILL table; bottle numbers inside the file automatically start from 1 consecutively, total rows = container count, and bottle numbers must exactly match container count [H]
- Sample-addition amount inside the file is in g and must be in [0,50] [H]
- Tank number inside the file must be in [1,30] [H]

### 多通道固体称量工作站_V2
- Container type = 10ml耐压反应管, count ∈ [0, 4] [H]
- Up to 10 solids [H]
- Hopper number ∈ [1, 10] [H]
- Added sample ∈ (0, 40] g [H]
- Schema field order: `方案 → -反应管(int) → -进料信息(array) → --料斗编号(int) → --加料样(float)`; incorrect naming is [H]

### 单通道固体称量工作站_V1
- Maximum containers: 进样瓶 / 50ml耐热瓶 each ≤ 10 [H]
- Only one solid may be weighed each time [H]
- Required: 容器类型 / 容器数量 / 容器编号 / 开门位置 / 关门位置 / 进样质量 [H]
- 开门位置, 关门位置 ∈ {right, left, all} [H]
- 进样质量 ∈ (0,200) g [H]

### Liquid-handling platform family (capacity constraint summary)

| Platform | Max solution types | Max single volume | Cumulative upper limit per solution |
|---|---:|---:|---:|
| 1ml_V1 | 8 | 1 mL | 3 mL |
| 1ml_V2 | 16 | 1 mL | 3 mL |
| 5ml_V1 | 6 | 5 mL | 30 mL |
| 5ml_V2 | — | 5 mL | — (bottle-to-bottle only) |
| 5ml_V3 | 8 | 1 mL | 3 mL |

> Exceeding the cumulative per-solution limit is [H]. The same solution name across multiple stock-solution bottle numbers also violates one-bottle-one-liquid [H].

### 超声分散仪_V1 / V2
- Cleaning time ≥ 0 seconds (default 30); no explicit upper bound, but > 3600 seconds is treated as unreasonable design [L]

### 烘干机_V1 / 加热磁力搅拌_V1 / 常温磁力搅拌_V1
- Temperature / time and similar parameters have no explicit SKILL boundary; non-physical values (negative numbers, strings, etc.) are [M]

### 气相色谱仪_V1
- Container type = 气相54孔板, count = 1 [H]
- Required: 新建方法文件 / 开始分析行号 / BatchFile; `batchFile使用次数` is not required, default 10
- **新建方法文件 + BatchFile must be OBS URLs** shaped like `https://aichem-cloud-service.obs.cn-east-3.myhuaweicloud.com/...`; a filename string is [H]
- BatchFile may only modify the three fields `VialNo / Injvol / DataFileName` [H]
- 新建方法文件 = `Gas_Chromatograph_V1_新建方法文件模板文件.json` uploaded verbatim without modification [H]

---

## 5 · Characterization Prerequisite Chains and Hard Volume Constraints

### 5.1 [H] Prerequisite Chain Table

| Characterization workstation | Required prerequisite workstation chain |
|---|---|
| XRD_V1 | 谱学容器中转平台_V1 → 谱学磁力搅拌工作站_V1 → XRD_V1 |
| 红外光谱仪_V1 | 谱学容器中转平台_V1 → 谱学磁力搅拌工作站_V1 → 红外光谱仪_V1 |
| 紫外可见光谱仪_V1 | 谱学容器中转平台_V1 → 紫外可见光谱仪_V1 |
| 荧光光谱仪_V1 | 谱学容器中转平台_V1 → 荧光光谱仪_V1 |
| 气相色谱仪_V1 | 谱学容器中转平台_V1 → 气相色谱仪_V1 |
| 液相色谱仪_V1 | 谱学容器中转平台_V1 → 液相色谱仪_V1 |

Missing any station in the prerequisite chain is [H].

### 5.2 [H] Hard Test-Volume Constraints
- XRD_V1 / 红外光谱仪_V1: total sample volume before entering the workstation must be ≥ 4.0 mL.
- 双工位电化学工作站_V2: input sample must be > 4 mL ("大于 4ml").
- If preceding product volume < 4 mL: an explicit "liquid-handling platform + anhydrous ethanol top-up" step must be inserted; missing it is [H].
- If preceding product is solid powder: explicitly insert the process "liquid-handling platform adds 4 mL anhydrous ethanol + 谱学磁力搅拌工作站_V1 / 样品架放置-夹具识别"; missing it is [H].

### 5.3 [M] File-Type Parameter Upload
- Any field whose type is `file` in the SKILL.md table, such as GC BatchFile, photocatalysis file, or V2 weighing upload file, should contain an OBS URL returned by `upload2obs.py` rather than a filename.
- If a local path or filename is filled in, record [M]; if the field is not required, record [L].
- For workstations whose core parameter passing is file-based, the required item is the corresponding `file` field itself, not every process parameter expanded from inside the file. Typical examples:
  - 光催化工作站_V2 / `光催化流程`: `光催化文件` is required and type `file`.
  - 光照压膜工作站_V1 / `氢气检测膜压膜后光照流程` and `不压膜仅光照`: `光催化文件` is required and type `file`.
  - 移液平台四通道_V1 / `液体加样`: `参数设置.配液设置.参数文件` is required and type `file`.
  - 马弗炉_V1 / `马弗炉加热流程_96石英孔板`: `配置参数.马弗炉开门位置设置.加热参数文件` is required and type `file`.
  - 超声移液平台_V1 / `超声加液流程`: `配置参数.加液配置.参数文件` is required and type `file`.
- Therefore, R1 must not deduct "required parameter missing" points because the final JSON does not expand illumination time, lamp intensity, well-position addition volumes, heating program, or other file-internal content. Deduct under W3.2 / D4 only when the corresponding required `file` field is missing. If the `file` field exists but is not an OBS URL returned by `upload2obs.py`, deduct under W3.5 / D5.
- If the final JSON additionally uses annotation fields such as `_program`, `_file_template`, or `_purpose` to describe file-internal content, those fields cannot replace the required `file` field. R1 also does not treat those annotation fields as evidence that the file content is correct.

---

## 6 · Not Part of R1 Main Score: Closed Loop / Safety / Characterization-Chain Reasonableness (Scientific Dimensions)

> This section is for R2/R3 or human-review reference, and does not enter the R1 physical-device and system-constraint main score. R1 retains only device hard-safety boundaries, parameter hard upper limits, and system schema/parsing constraints; it does not evaluate whether the scientific goal is worth doing, whether the plan is closed-loop, or whether it is sufficient to support paper-level conclusions.

### 6.1 [L] Observability of Scientific Targets
- The plan should be able to directly quantify target quantities using existing laboratory characterization workstations.
- Examples: measuring N₂ selectivity → GC; measuring NO₂⁻ → UV-Vis (Griess); measuring H₂ → GC; measuring crystal phase → XRD; measuring functional groups → IR.
- Missing any key observation channel is [L].

### 6.2 [L] Closed-Loop Feedback
- Multi-round iterative plans should declare a feedback algorithm (GP / BO / Sobol / RandomSearch, etc.) and stopping criteria.
- A single-round "batch parallel" plan is not considered closed loop [L].

### 6.3 [L] Safety Boundary Declaration
- Plans involving HTHP, electrochemical high current, or toxic byproducts should explicitly state abnormal shutdown conditions (pressure / temperature / voltage upper limit, timeout alarm, etc.).
- Missing declaration is [L].

### 6.4 [L] Failure Fallback
- The plan should explain how a sample is handled when a single workstation fails (exclude / downweight).

---

## 7 · Severity Quick Reference

| Level | Meaning | Physical consequence | Deduction (suggested) |
|---|---|---|---|
| **[H]** Critical | Hard-constraint violation | Workstation rejection, robotic abort, invalid data, risk of device hardware damage | -5 to -8 points per item |
| **[M]** Major | Schema or soft-strong-constraint violation | `workflow-generator` parsing failure, critical field missing, file not uploaded | -2 points per item |
| **[L]** Minor | Design defect or recommendation item | Executable but unprofessional experimental design / affected data quality | -0.5 points per item |

---

## 7.5 · `workflow-generator` System-Level Constraints

> This section comes from `skills/workflow-generator/SKILL.md` + `references/api-documentation.md` + `scripts/generate.py`, and defines hard conditions for whether a plan JSON can pass the `parse_workstation` service.

### W1 Top-Level Request Body Structure (violation of any item is [H])
- **W1.1 [H]** Top level must contain `experiment_steps` (object) and `plan_name` (string). `experiment_steps.steps` must be an array.
- **W1.2 [H]** At the top level, no sibling fields other than `experiment_steps`, `plan_name`, and optional `token` are allowed, e.g. putting `实验名称` and `plan_name` at the top level simultaneously is not allowed.
- **W1.3 [M]** `experiment_steps.unknown_steps` may be omitted, but if present it must be `null` or an array.
- **W1.4 [M]** `Content-Type` must be `application/json`; a non-JSON body directly returns 502.
- **W1.5 [H]** If `token` is manually written at the top level, it must be in `Bearer <uuid>` format; otherwise `generate.py` will overwrite it with the `AICHEM_APP_TOKEN` environment variable.

### W2 Step-Level Hard Validation (`validate_experiment_steps` in generate.py)
- **W2.1 [H]** Every step must contain `step_number`, `workstation`, and `operation`; missing any one directly raises `ValueError`.
- **W2.2 [H]** `step_number` must be a positive integer and type = int. Numeric strings, negative numbers, and 0 are all [H].
- **W2.3 [H]** `step_number` should start from 1 and increase consecutively (api-documentation.md §"注意事项 3"). Skipped numbering is [M]; disorder is [H].
- **W2.4 [H]** Although the `id` field is not hard-validated by generate.py, the `parse_workstation` server routes to the concrete workstation parser by `id`: missing id or id not matching workstation name → backend 500, code=500 error response.
- **W2.5 [M]** The `parameters` field may be an empty object `{}`, but "all container numbers in parameters must be positive integers" and "parameter units must match the field name" (api-documentation.md §"注意事项 1-2").

### W3 Server-Side Parsing Constraints (`parse_workstation` workstation-instruction parsing)
- **W3.1 [H]** The server routes to the corresponding workstation parser based on the `workstation + id + operation` triplet in each step. The three must be **fully mutually consistent**, i.e. match "§2 whitelist + §3 I/O matrix" one-to-one. Any mismatch → "workstation instruction parsing failed" code 500.
- **W3.2 [H]** Each workstation parser validates fields marked "是否必填=是" in the SKILL.md table inside `parameters`; missing any one returns code 500.
- **W3.3 [H]** The server whitelist-validates **enum fields**, such as `通气状态 ∈ {none,one,two,both}` and `碳纸晾干设置 ∈ {heat,naturalDry}`; illegal values → code 500.
- **W3.4 [H]** The server boundary-validates **range fields**, such as `电解液加入量 ∈ (9,50]`; out-of-range values → code 500.
- **W3.5 [M]** File-type fields (`file` type, such as GC `BatchFile`, photocatalysis file, and V2 weighing upload file) must be OBS URLs returned by `upload2obs.py`; local paths or filenames → server retrieval failure code 500.

### W4 Network Layer and Authentication
- **W4.1 [H]** Environment variable `WORKFLOW_SERVICE_URL` must be in `host:port` form, without scheme. For example, `114.214.255.82:18009`; writing `http://114.214.255.82:18009` causes generate.py to concatenate `http://http://...` and fail.
- **W4.2 [H]** Environment variable `AICHEM_APP_TOKEN` (or `WORKFLOW_TOKEN`) must be in `Bearer <uuid>` format; missing or expired → 401.
- **W4.3 [M]** Server response must be JSON; HTTP 200 with non-JSON body raises an exception.
- **W4.4 [M]** Only `response.code = 200` counts as success and returns `data.template_id`; other codes are treated as business failures.
- **W4.5 [L]** generate.py has no default timeout (`requests.post(url, json=...)`); long plans should pay attention to socket timeout.

### W5 Error Code → Debug Mapping

| code | Meaning | Common causes |
|---|---|---|
| 200 | Success | Returns `data.template_id` |
| 400 | Request parameter error | Wrong top-level structure, step missing fields |
| 500 | Server internal error | workstation id/name/operation mismatch, required parameter missing, enum out of range, range out of bounds, file URL retrieval failure |

---

## 7.6 · `lab-operation` Runtime Chain Constraints (not part of R1 final JSON main score)

> This section comes from `skills/lab-operation/SKILL.md` + `README.md` + `scripts/*.py`. It is the hard full-chain condition for materializing a `template_id` into a real task and starting execution.
> This section is used for independent dispatch/runtime statistics or execution-log extraction, not for penalizing a final JSON that only contains experimental steps. R1 may only lightly deduct for schema pollution if illegal runtime fields are mixed into the plan JSON top level; it must not deduct because token, app_label, template_id, task_id, or actual dispatch-script calls are absent.

### L1 Laboratory Type and Permissions
- **L1.1 [H]** Laboratories are divided into two types:
  - **Central-control laboratory** (label such as `centerLab`): can dispatch tasks to edge laboratories and can store/query templates; **cannot execute experiments itself**.
  - **Edge laboratory** (label such as `303Lab`): can dispatch and execute tasks itself, and can receive tasks dispatched by the central lab; **cannot operate other laboratories**.
- **L1.2 [H]** Edge laboratories **cannot operate each other** (edge A cannot dispatch to edge B).
- **L1.3 [H]** Before cross-laboratory operation, call `check_lab_consistency.py --app-label <target>` to verify that the current token is consistent with the target laboratory or belongs to centerLab. Failure → "当前实验室是 X，无法向 Y 实验室进行操作".

### L2 Token / Authentication Chain
- **L2.1 [H]** `config.CONFIG.app_token` must be in `Bearer <uuid>` format; scripts submit it through the `apptoken` HTTP header.
- **L2.2 [H]** Gateway `/auth/parseAppToken` must return `{"code":200, "data":{"appLabel":"303Lab", "isCenter":false}}`; any missing field means "无法获取实验室标签".
- **L2.3 [H]** Authentication failure returns `code=401 "未能读取到有效 token"`; the entire lab-operation chain is unusable and token must be reset.

### L3 Task Dispatch and Start Chain
- **L3.1 [H]** Complete execution chain: `get_current_lab_label.py` → `check_lab_consistency.py` → optional `select_template_list.py` → `generate_task.py` → `start_task.py` → `select_task_list.py`/`get_task_result.py`. Skipping `generate_task` and directly calling `start_task` fails.
- **L3.2 [H]** `generate_task.py` has three required arguments: `--template-id`, `--template-source-label`, and `--app-label`. `template-id` must be the `template_id` returned by the previous workflow-generator step.
- **L3.3 [H]** `start_task.py` must be called when task status is `100 待执行`; other statuses (already started / completed, etc.) are rejected.
- **L3.4 [M]** Common `generate_task` failure codes: `401 登录过期`, `500 业务异常`, empty `data`.

### L4 Laboratory Label Naming
- **L4.1 [H]** `app_label` uses camelCase format, such as `303Lab`, `centerLab`, `anotherLab`. `303lab`, `303_lab`, and `303-lab` are illegal → server cannot find the laboratory.
- **L4.2 [L]** Use "display name" for user-facing output (e.g. "303 实验室") and "label" for system calls (e.g. `303Lab`); do not mix them.

### L5 Task State Machine (`select_task_list --status`)

| Status code | Meaning | Can `start_task`? | Can `get_task_result`? |
|---|---|---|---|
| 0 | Not started | ✗ | ✗ |
| 99 | Queued | ✗ | ✗ |
| 100 | **Pending execution** | ✓ | ✗ |
| 200 | In progress | ✗ | ✗ |
| 230 | Suspended | ✗ | Partial |
| 260 | Error | ✗ | Partial |
| 300 | **Completed** | ✗ | ✓ |
| 360 | Expired | ✗ | ✓ |
| 370 | Cancelled | ✗ | ✗ |
| 400 | Terminated | ✗ | Partial |

- **L5.1 [H]** Trying to call `start_task` in a non-100 state → business interface exception.

### L6 Workstation Resource Status (`select_workstation_list --status`)

| Status code | Meaning | Can this workstation schedule a new task? |
|---|---|---|
| 100 | Not activated | ✗ |
| 200 | **Idle** | ✓ |
| 300 | Error | ✗ (contact operations) |
| 400 | Offline | ✗ |
| 500 | Busy | ✗ (wait) |
| 600 | Charging | ✗ (e.g. AGV) |

- **L6.1 [M]** Although the design stage does not strictly require querying workstation status, if the plan requires using multiple same-type workstations in parallel (e.g. 4 HTHP reactors), then at runtime that workstation type must have ≥ 4 instances with status = 200, otherwise the task will queue or even fail.

### L7 Template Query Constraints
- **L7.1 [L]** `select_template_list.py` supports filtering by `--source-type`: `1`=manually created, `2`=AI generated, `0`=all.
- **L7.2 [M]** A template with `enable=0` cannot be used as input to `generate_task`.
- **L7.3 [M]** Templates created by centerLab can be referenced by multiple edge laboratories, but every `generate_task` call must explicitly declare `--template-source-label centerLab` + `--app-label 303Lab`.

### L8 Single-Task Path Integrity (fields to consider during plan design)
- **L8.1 [L]** The plan JSON **does not need** to contain `template_id` or `task_id`, because these are runtime identifiers produced by `workflow-generator` generation and `lab-operation` dispatch. Their presence in the plan is "over-declaration" [L].
- **L8.2 [L]** The plan **does not need** to contain `app_label` or `template_source_label`, for the same reason.

### L9 Failure Fallback (runtime)
- **L9.1 [H]** If a workstation enters `status=300 错误` during task execution: the current step immediately aborts and the task enters `260 错误`. If the plan design lacks a `failure fallback` declaration (see §6.4), manual handling is required.
- **L9.2 [M]** Once a task enters `400 已终止`, corresponding materials have already been consumed but experiment data may be incomplete; the plan should declare in advance "whether to rerun a segment after failure".

---

## 8 · Evaluation Checklist Quick Reference (40 items)

Judge yes/no for every plan.

**Schema layer (chemistry-experiment-workstation)**
1. Does the top level contain one of `实验名称`/`plan_name` + step list + `unknown_steps`?
2. Does every step contain the five fields `step_number / workstation / id / operation / parameters`?
3. Does `id` exactly match the whitelist?
4. Is the Chinese `workstation` name in the whitelist?
5. Is `operation` a legal operation for that workstation?
6. Are there fields outside the schema, such as `_注释`?
7. Is `开盖的瓶号` in object-array format?

**Top-level process layer**
8. Is the start a legal material-configuration step (for synthesis scenarios)?
9. Is the endpoint `容器置放平台_V1 / 物料放置` (for synthesis scenarios)?
10. Is container type consistent throughout the process, or switched only according to conversions allowed by the workstation matrix?
11. Is the container-number set monotonically non-increasing?
12. Is the one-bottle-one-liquid principle preserved?
13. Are all cross-workstation lid-state transitions accompanied by inserted open/close steps?
14. Does the output contain "reviewed SKILL list" and "used SKILL list" (process-audit item, not part of R1 final JSON main score)?
15. Does the output contain CHECKPOINT 1 / 2 (process-audit item, not part of R1 final JSON main score)?

**I/O chain layer**
16. Does container type match for every adjacent step pair?
17. Does container state match for every adjacent step pair?
18. Does sample state match for every adjacent step pair?
19. Are prerequisite chains complete before testing workstations?
20. Are the "test volume ≥4 mL" constraints for XRD / IR / electrochemistry satisfied?

**Parameter layer**
21. Are required parameters complete?
22. Are range-type parameters within SKILL ranges?
23. Are enum-type parameters legal?
24. Does cumulative volume per solution exceed the upper limit?
25. Is container count within the allowed range for that workstation?

**workflow-generator system layer**
26. Does the top level conform to `{experiment_steps:{steps:[...], unknown_steps}, plan_name}`?
27. Is `step_number` a positive integer and consecutive from 1?
28. Is the `workstation + id + operation` triplet mutually consistent (cross-validated against whitelist)?
29. Do file-type parameters contain OBS URLs rather than local filenames?
30. Does the plan avoid illegal top-level sibling fields, such as top-level `实验名称` coexisting with `plan_name`?

**lab-operation system layer**
31. Does the plan avoid hard-coding `template_id` / `task_id` (runtime products)?
32. Does the plan avoid hard-coding `app_label` / `template_source_label` (runtime parameters)?
33. In multi-workstation parallel scenarios, does the plan declare dependency on the number of available workstation instances?
34. Does the plan reasonably choose synthesis vs testing start/end rules?
35. Does the failure fallback strategy correspond to runtime task states (`260 错误` / `400 已终止`; runtime-audit item, not part of R1 final JSON main score)?

**Scientific layer (not part of R1 main score)**
36. Is a real existing electrochemical testing template selected, if applicable?
37. Is the scientific target quantity declared and quantifiable by existing characterization?
38. Is the feedback algorithm / stopping criterion declared for multi-round scenarios?
39. Is safety / abnormal shutdown declared?
40. Is a failure fallback strategy declared?

---

**End of constraint checklist. Any design choice beyond this checklist that "seems reasonable but is not declared by SKILL" should be judged as "not declared = not allowed".**
