# Using the Modal Dialog Component

The `ModalDialog` component is part of Video.js core and provides a baked-in UI for full-player overlays.

## Table of Contents

* [Creating a ModalDialog](#creating-a-modaldialog)
  * [Example Using createModal()](#example-using-createmodal)
  * [Example Using the ModalDialog Constructor](#example-using-the-modaldialog-constructor)
* [Styling Modals Independently](#styling-modals-independently)

## Creating a ModalDialog

Aside from the [built-in Video.js component-creation methods][creating-component], the player includes a `createModal()` helper method.

We'll demonstrate both approaches in this document by creating a modal that opens when the player becomes paused and resumes playback when it is closed.

### Example Using `createModal()`

The `createModal()` method is intended for creating one-off modals that need to open for some temporary purpose. Therefore, they open themselves immediately upon creation and, by default, dispose themselves immediately upon closing.

```js
var player = videojs('my-player');

player.on('pause', function() {

  // Modals are temporary by default. They dispose themselves when they are
  // closed; so, we can create a new one each time the player is paused and
  // not worry about leaving extra nodes hanging around.
  var modal = player.createModal('This is a modal!');

  // When the modal closes, resume playback.
  modal.on('modalclose', function() {
    player.play();
  });
});
```

The `createModal()` method also takes a second argument - an object containing options for the modal. Refer to [the API documentation][api-doc] for a full set of options.

### Example Using the `ModalDialog` Constructor

Unlike when using `createModal()`, a modal created with any of the [common component creation methods][creating-component] _does not_ open by default. This makes this approach better suited to modals that are expected to live in the DOM indefinitely.

```js
var player = videojs('my-player');
var ModalDialog = videojs.getComponent('ModalDialog');

var modal = new ModalDialog(player, {

  // We don't want this modal to go away when it closes.
  temporary: false
});

player.addChild(modal);

player.on('pause', function() {
  modal.open();
});

player.on('play', function() {
  modal.close();
});
```

Both of these examples are equivalent when it comes to the user's experience. Implementors should use whichever better suits their use-case.

## Styling Modals Independently

A common need for modals is to style them independently from one another. The recommended approach for this is to add a custom class to your modal and target that using CSS:

```js
modal.addClass('vjs-my-fancy-modal');
```

[api-doc]: https://docs.videojs.com/ModalDialog.html

[creating-component]: /docs/guides/components.md#creating-a-component
