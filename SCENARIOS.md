## Scenarios: How We Might Model Various Programs

### A counter, and a button that increments the counter.

* def mutable count
* def increment
* on initialize: render button with on-click : event-source (event-source passed as parameter?)
* on button-click: update mutable with increment, render
* app starts
* event with type initialize
* app renders
* user clicks button
* event with type button click triggers counter-update and re-render

### Same as above, but without event system

* def mutable global.count
* def render
* def increment
* def action named update-count
  * mutates global.count with updater increment
  * render global.count
* on init: render button with on-click: update-count
* app starts, ui renders
* user clicks button
* update-count fires

### A button that, when clicked, displays a random number.

### Types for Common Methods and Properties

Anything not persistent can be called "safe".
Anything not idempotent can be called "unbounded".

* console.log - effect
* Math.random - effect, event-source
* localStorage.set - effect, persistent, idempotent
* localStorage.get - effect, event-source
* ReactDOM.render - effect, idempotent
* Date.now - effect, event-source
* Math.PI - value, number
* Math.floor - fun
* React.createElement - fun

## Key Maps

* tree
  * up
  * down
  * left
  * right
  * expand/collapse
  * new node
* list
  * up
  * down
  * left
  * right
  * new node

### Key Types

* enter submenu
* return to previous menu
* return to parent menu
* action ("leaf")
* help?

### Actions

* add label
* add comment
* create new node/open node form
* open search form
* find all references?

### Hypotheses

* A function that contains no effects and no mutable references is pure.

### UI States and Actions

* Global

  * Up
  * Down
  * Left
  * Right
  * Jump Up
  * Jump Down
  * Jump Left
  * Jump Right
  * Enter/Open Search
  * Enter Help Mode
  * Create Link
  * Create Input
  * Create Dependency

* Node selected

  * Change node type

* Node selected, change type mode

  * all node types

* Op selected

  * Enter "Change Op"

* Op selected, change mode

  * all ops

* Bool Val selected

  * change to false
  * change to true

* Num/String Val selected

  * enter change mode

* Num val selected, change mode - NUMBER MODE
* String val selected, change mode - TEXT MODE

* Link/Input/Dep Ref selected
  * Open change mode

- Link/Input/Dep change mode search selected

  * Enter search change mode - TEXT MODE

- Link/Input/Dep search option selected

  * Change to

- Link/Input/Dep selected

  * Add comment
  * Open edit comments

- Link/Input/Dep edit comment mode, comment selected
  * Enter edit mode - TEXT
  * Delete
