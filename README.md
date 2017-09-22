## V1 Summary

- First Class Packages and Versioning
- Plain English, Easy-to-Change Variable Names and Descriptions
- Smart Comments
- Easy Test Creation
- “Practical” Types For Side Effects
- “Community” and "Official" Types
- Whitelist of Known/"Accepted" methods for references

### Philosophies
- Programming as Process of **Discovery**, not Creation
- Most Everything in Code is Really Metadata (Variable Names, Types, etc.)
- Pit of Success: Make Most Important and Common Techniques Easy, Exceptions Hard, but...
- Powerful Escape Hatches: Warn, Don't Prevent

### Game Plan
- Brainstorm Scenarios
- Prototype Node Structure
- Test Node Structure Functionality
- Node Structure Visualization
- Prototype Commit Flow
- Test Commit Functionality
- Tree Keyboard Exploration
- Tree Keyboard Editing
- Test Generation
- Previewing

## Details

- Node Types
  - Immutable
  - Generic
  - Number
  - String
  - Boolean
  - Regex
  - Undefined
  - null
  - Others...
  - Static Reference
    - Object reference that can't be mutated
    - Use for standard lib methods and most npm packages
  - Mutable Reference
    - Reference inside object that’s “intended” to be mutated
    - Could potentially also be standalone mutable reference (already exists for “free” in a sense by defining on global object, so...never mind?)
  - Op
    - Same type as Functions?
    - Certain operations not currently modeled as functions, such as `+`, `-`, `new`, etc.
    - New Op: Module
      - For including modules, by specific version
    - Can we derive what's considered a Function solely by analyzing Ops and other Nodes?
    - Call
      - **NOTE:** probably not necessary with **Event** type input described in **Input** section
      - Special Op that works with special **Unit** type (a la Reason)
      - When all other Inputs fulfilled, must still be passed **Unit** to execute?
  - Input
    - What "drives" the system. Callbacks/listeners push events to these inputs.
    - **Event** type used to "bind" functions to defer calling and pass around function itself, not invocation result 
  - Generator
    - Returns a non-deterministic value; essentially a "non-idempotent" function
    - Examples: Math.random, Date.now, shortid
  - Effect
    - Can these all be combined into one property to cover safety, idempotence, and ephemerality?
    - Publish
      - Puts value on certain input
      - Pass to event handlers
    - Safe (Level 0)
      - Safe to re-run after a relevant code change, for example
      - Examples: log, render
    - Unsafe (Levels)
      - Examples: write to disk
    - Idempotent
      - Effects “stabilize” eventually
      - Examples: render, GET, PUT, PATCH, DELETE
      - Counterexamples: log, POST, write to disk
    - Ephemeral (Levels?)
      - Easy to clear effects and “waste”
      - Examples: log, play sound, render, memory
      - Counterexamples: write to disk, launch missile
    - Unknown
- Edit and Commit Types
  - Create
    - Creates a new "flow" (initial node)
  - Link
    - links node to another
  - Add
    - Sugar for Create + Link
    - For existing flow, creates copy with node appended
  - Remove
    - For existing flow, creates copy with node removed
  - Change
    - Sugar for **Add** and **Remove**
  - Instance
    - Creates copy of flow (to include in another flow)
    - JS analogy: function call
    - Change to original flow changes this flow
  - Variant
    - Creates copy of flow
    - Flow copy behavior can be modified
    - Change to original flow can propagate to branch flow
      - Proposed behavior: branch flows show diffs and user can selectively patch them in.
  - Fork
    - Creates copy of flow
    - Changes to original flow DO NOT change fork
- View Types
  - Select Node
  - Select Flow
    - select multiple nodes to define a "flow" section that the user wishes to operate on
    - require labeling first?
  - Node/Flow metadata operations
    - Add Name
    - Add Description
    - Add Comment
    - Add Type
  - Collapse
  - Expand
  - Show Versions
- Saved Values
  - Mark as Invariant
    - must hold true
  - Mark as Invalid
    - necessary? basically sugar for "must NOT hold true"
  - Clear
  - Set Max

## V2
- Networked/Distributed Syncing
  - Both Decentralized and Centralized Options
- Strong Types
  - Test Generation From Types
  - Nodes can have multiple types?
- Release Tagging
- Include Other Assets Besides NPM Modules (CSS, images, etc.)
  - Escape hatch for arbitrary command line operations?
- Custom Edit Operations
- Secure Private Modules
- Other Targets! (C, Jai, OCaml, Assembly, etc.)
- Optimized Compilation
- First Class Dependency Injection/Context?

#

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).