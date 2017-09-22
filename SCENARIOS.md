## Scenarios: How We Might Model Various Programs

### A counter, and a button that increments the counter.

- def mutable count
- def increment
- on initialize: render button with on-click : event-source (event-source passed as parameter?)
- on button-click: update mutable with increment, render 
- app starts
- event with type initialize
- app renders
- user clicks button
- event with type button click triggers counter-update and re-render

### Same as above, but without event system

- def mutable global.count
- def render
- def increment
- def action named update-count
  - mutates global.count with updater increment
  - render global.count
- on init: render button with on-click: update-count
- app starts, ui renders
- user clicks button
- update-count fires

### Same as above, but in vanilla JS.

- 

### A button that, when clicked, displays a random number.

- 

### Types for Common Methods and Properties

Anything not persistent can be called "safe".
Anything not idempotent can be called "unbounded".

- console.log - effect 
- Math.random - effect, event-source
- localStorage.set - effect, persistent, idempotent
- localStorage.get - effect, event-source
- ReactDOM.render - effect, idempotent
- Date.now - effect, event-source
- Math.PI - value, number
- Math.floor - fun
- React.createElement - fun

#

### Hypotheses

- A function that contains no effects and no mutable references is pure.