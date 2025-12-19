# TODO List – AI‑Assisted Minesweeper

---

## Phase 1: Core Minesweeper Engine (NO AI)

* [x] Create `index.html` layout and container
* [x] Create grid layout using CSS
* [x] Initialize board data structure
* [x] Randomly place mines
* [x] Calculate adjacent mine counts
* [x] Implement left‑click reveal logic
* [x] Implement flood‑fill for empty cells
* [x] Implement right‑click flag toggle
* [x] Ensure first click is always safe
* [x] Detect win condition
* [x] Detect lose condition
* [x] Add restart button
* [x] Add GIF indicator for mine display
* [x] Disable "New Game" button during active gameplay

**Acceptance Criteria:**

* Fully playable Minesweeper
* No AI logic present

---

## Phase 2: Rule‑Based AI Hint System

* [x] Add "Ask AI for Hint" button
* [x] Scan revealed numbered cells
* [x] Implement logical rules:

  * Number == flagged neighbors → remaining neighbors safe
  * Number == unrevealed neighbors → all unrevealed are mines
* [x] Select one safe cell to suggest
* [x] Generate explanation text
* [x] Highlight suggested cell visually
* [x] Display explanation in side panel

**Acceptance Criteria:**

* AI suggests valid safe moves
* Explanations are deterministic and correct

---

## Phase 3: AI Reasoning Categories & Confidence

* [x] Add reasoning categories:

  * Direct Deduction
  * Pattern Recognition
  * Assumption / Low Confidence
* [x] Assign confidence levels (High / Medium / Low)
* [x] Display reasoning category in UI
* [x] Highlight AI‑suggested cell

**Acceptance Criteria:**

* Each hint includes reasoning + confidence

---

## Phase 4: Optional Groq LLM Integration

* [ ] Add Groq API configuration
* [ ] Serialize board state and AI decision
* [ ] Send explanation request to Groq
* [ ] Replace local explanation with LLM version
* [ ] Add fallback if API key is missing

**Acceptance Criteria:**

* Game works without Groq
* Groq improves explanation quality only

---

## Phase 5: UI Polish & Demo Readiness

* [ ] Improve retro styling
* [ ] Add instructions panel
* [ ] Disable AI button during processing
* [ ] Add explanation modal or side panel

**Acceptance Criteria:**

* Clean, demo‑ready experience


