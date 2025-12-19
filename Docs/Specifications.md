# Software Requirements Specification (SRS)

## Project Title

AI‑Assisted Minesweeper (Retro Revival)

---

## 1. Overview

AI‑Assisted Minesweeper is a browser‑based recreation of the classic Minesweeper game, enhanced with a modern, explainable AI assistant. The project demonstrates complex logical reasoning using deterministic algorithms, with optional Large Language Model (LLM) support for enhanced explanations.

The system is intentionally designed so that **core gameplay works without any AI or external APIs**, ensuring reliability and clarity.

---

## 2. Objectives

* Recreate classic Minesweeper using vanilla web technologies
* Demonstrate complex logic through game mechanics and rule‑based reasoning
* Introduce an explainable AI assistant that helps, not replaces, the player
* Optionally enhance AI explanations using Groq LLM

---

## 3. Development Phases

### Phase 1: Core Game Engine (No AI)

* Fully functional Minesweeper implementation
* Pure JavaScript logic

### Phase 2: Rule‑Based AI Hint System

* Deterministic AI logic based on Minesweeper rules
* Suggests safe moves with explanations

### Phase 3: AI Reasoning Categorization

* Each AI hint is labeled with reasoning type and confidence

### Phase 4: Optional LLM Explanation Layer (Groq)

* Groq is used only to rewrite explanations in natural language
* Groq does NOT decide moves
* System gracefully falls back if API is unavailable

---

## 4. Functional Requirements

### 4.1 Game Board

* Display a 9×9 grid of cells
* Random mine placement
* First click must always be safe

### 4.2 Cell Interaction

* Left‑click reveals a cell
* Right‑click toggles a flag
* Revealed cells show adjacent mine count
* Empty cells auto‑expand

### 4.3 Game States

* Win when all non‑mine cells are revealed
* Lose when a mine is revealed
* Restart functionality available

### 4.4 Rule‑Based AI Hint System

* AI analyzes current board state
* AI suggests one safe cell when possible
* AI provides:

  * Explanation
  * Reasoning category
  * Confidence level

### 4.5 LLM Enhancement (Optional)

* Groq receives:

  * Board summary
  * AI decision
  * Reasoning category
* Groq returns improved explanation text only

---

## 5. Non‑Functional Requirements

* No external libraries or frameworks
* Runs fully in the browser
* Clear, readable UI
* Retro‑inspired visual style

---

## 6. Technology Stack

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)

---

## 7. Constraints & Assumptions

* AI logic must remain explainable and deterministic
* LLM usage is optional and non‑blocking

---

## 8. Success Criteria

* Game functions correctly without AI
* AI hints are logical and understandable
* Judges can clearly identify complex logic and AI augmentation
