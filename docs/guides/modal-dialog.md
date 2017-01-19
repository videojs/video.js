# Implementing the ModalDialog

<style>.video-js { height: 344px; width: 610px; } .vjs-my-custom-modal .vjs-modal-dialog-content { color: yellow; margin-top: 40px; margin-left: 100px; }</style>

In this topic, you will learn how to use the ModalDialog component of Brightcove Player.

## Example

The following shows an example of the ModalDialog component. In this case, the modal window is displayed on initial player display, but methods exist to display it programmatically also. Here some yellow text is all that is displayed in the modal window. The modal window blocks all interaction with the player until the **X** in the top-right corner is clicked, or **ESC** is pressed.

## Creating the ModalDialog

There are various ways to create implement the ModalDialog, the two being used in this document are:

*   Using `createModal()`, a helper function
*   Using the `ModalDialog()` constructor

### Using the createModal() helper function

The `createModal()` method encapsulates code to make it easier for you to use the ModalDialog. The syntax is as follows:

`createModal(content,options)`

<table class="bcls-table">

<thead class="bcls-table__head">

<tr>

<th>Parameter</th>

<th>Required</th>

<th>Description</th>

</tr>

</thead>

<tbody class="bcls-table__body">

<tr>

<td>content</td>

<td>No (although if not provided,  
nothing will be displayed by the modal)</td>

<td>Content to display in the modal</td>

</tr>

<tr>

<td>options</td>

<td>No</td>

<td>An object to set other options for the modal; detailed later in this document</td>

</tr>

</tbody>

</table>

The following shows a simple implementation of the ModalDialog being created and used used with Brightcove Player.

      <video id="myPlayerID"
        data-account="3676484087001"
        data-player="S1lOCfk6Ze"
        data-embed="default"
        data-application-id
        class="video-js"
        controls></video>
      <script src="//players.brightcove.net/3676484087001/S1lOCfk6Ze_default/index.min.js"></script>

      <script type="text/javascript">
        videojs('myPlayerID').ready(function(){
          var myPlayer = this;
          myPlayer.createModal('Using the helper function');
        });
      </script>

### Using the ModalDialog constructor

You can also use the class' constructor to implement the ModalDialog. This is a two step process, getting the class then instantiating an object. The syntax is as follows:

    var ModalDialog = videojs.getComponent('ModalDialog');
    var myModal = new ModalDialog(player, options);

<table class="bcls-table">

<thead class="bcls-table__head">

<tr>

<th>Parameter</th>

<th>Required</th>

<th>Description</th>

</tr>

</thead>

<tbody class="bcls-table__body">

<tr>

<td>player</td>

<td>Yes</td>

<td>The player to which the modal will be applied</td>

</tr>

<tr>

<td>options</td>

<td>No</td>

<td>An object to set other options for the modal; detailed in the next section</td>

</tr>

</tbody>

</table>

The following shows an implementation of the ModalDialog being created and used with Brightcove Player.

      <video id="myPlayerID"
        data-account="3676484087001"
        data-player="S1lOCfk6Ze"
        data-embed="default"
        data-application-id
        class="video-js"
        controls></video>
      <script src="//players.brightcove.net/3676484087001/S1lOCfk6Ze_default/index.min.js"></script>

      <script type="text/javascript">
        videojs('myPlayerID').ready(function(){
          var myPlayer = this,
            options = {};
          options.content = 'In the  modal';
          options.label = 'the label';

          var ModalDialog = videojs.getComponent('ModalDialog');
          var myModal = new ModalDialog(myPlayer, options);
          myPlayer.addChild(myModal);
          myModal.open();
        });
      </script>

<aside class="bcls-aside bcls-aside--information">In this case, the text that appears in the ModalDialog is set in the `options.content` value.</aside>

## The options object

The following are properties you can use as part of the options object for use with the ModalDialog class:

<table class="bcls-table">

<thead class="bcls-table__head">

<tr>

<th>Property</th>

<th>Data type</th>

<th>Default Value</th>

<th>Description</th>

</tr>

</thead>

<tbody class="bcls-table__body">

<tr>

<td>content</td>

<td>Mixed (String or DOM element)</td>

<td>Undefined</td>

<td>Customizable content that appears in the modal</td>

</tr>

<tr>

<td>description</td>

<td>String</td>

<td>Undefined</td>

<td>A text description for the modal, primarily for accessibility</td>

</tr>

<tr>

<td>fillAlways</td>

<td>Boolean</td>

<td>true</td>

<td>Normally, modals are automatically filled only the first time they open; this option tells the modal to refresh its content every time it opens</td>

</tr>

<tr>

<td>label</td>

<td>String</td>

<td>Undefined</td>

<td>A text label for the modal, primarily for accessibility</td>

</tr>

<tr>

<td>temporary</td>

<td>Boolean</td>

<td>true</td>

<td>If `true` the modal can only be opened once; it will be disposed as soon as it's closed</td>

</tr>

<tr>

<td>uncloseable</td>

<td>Boolean</td>

<td>false</td>

<td>If `true` the user will not be able to close the modal through the UI in the normal ways; programmatic closing is still possible</td>

</tr>

</tbody>

</table>

The previous code sample shows using the `options` object to set and use the `content` and `label` properties with a ModalDialog.

## Methods

The following are methods that are part of the ModalDialog class:

<table class="bcls-table">

<thead class="bcls-table__head">

<tr>

<th>Method</th>

<th>Description</th>

</tr>

</thead>

<tbody class="bcls-table__body">

<tr>

<td>close()</td>

<td>Closes the modal</td>

</tr>

<tr>

<td>closeable()</td>

<td>Returns a Boolean reflecting if the modal is closeable or not</td>

</tr>

<tr>

<td>description()</td>

<td>Returns the description string for this modal; primarily used for accessibility</td>

</tr>

<tr>

<td>empty()</td>

<td>Empties the content element; this happens automatically anytime the modal is filled</td>

</tr>

<tr>

<td>fill()</td>

<td>Fill the modal's content element with the modal's `content` option; the content element will be emptied before this change takes place</td>

</tr>

<tr>

<td>label()</td>

<td>Returns the label string for this modal; primarily used for accessibility</td>

</tr>

<tr>

<td>open()</td>

<td>Opens the modal</td>

</tr>

<tr>

<td>opened()</td>

<td>Returns a Boolean reflecting if the modal is opened currently</td>

</tr>

</tbody>

</table>

## Styling the content

By default the text displayed in the modal is white and located on the top-left, as shown here:

![Alt text](http://learning-services-media.brightcove.com/doc-assets/player-development/player-customization/modal-dialog/default-look.png)


You can change location and style of the text by using CSS. To do this you use can add a class to the ModalDialog and create a class selector and style as you choose. The process to style the modal follows these steps:

1.  Programmatically add a class to the modal; in this document `.vjs-my-custom-modal` is used, but you can name this class whatever you wish
2.  Create the style using the newly added class and the class that is automatically a child of the modal; this class is `.vjs-modal-dialog-content`, for example:

        .vjs-my-custom-modal .vjs-modal-dialog-content {
          color: red;
          margin-top: 40px;
          margin-left: 40px;
        }

The style shown above would appear as follows:

![Alt text](http://learning-services-media.brightcove.com/doc-assets/player-development/player-customization/modal-dialog/styled-look.png)

Here is the code to use a style with the `createModal()` helper function:

    <head>
      <meta charset="UTF-8">
      <title>Untitled Document</title>
      <style>
        .video-js {
          height: 344px;
          width: 610px;
        }
        .vjs-my-custom-modal .vjs-modal-dialog-content {
          color: red;
          margin-top: 40px;
          margin-left: 40px;
        }
      </style>
    </head>

    <body>

      <video id="myPlayerID"
        data-account="1507807800001"
        data-player="HJLWns1Zbx"
        data-embed="default"
        data-application-id
        class="video-js"
        controls></video>
      <script src="//players.brightcove.net/1507807800001/HJLWns1Zbx_default/index.min.js"></script>

      <script type="text/javascript">
        videojs('myPlayerID').ready(function(){
          var myPlayer = this;
          const myModal = myPlayer.createModal('In the modal');
          myModal.addClass('vjs-my-custom-modal');
        });
      </script>

Here is the complete code to use a style with the `ModalDialog` constructor function:

    <head>
      <meta charset="UTF-8">
      <title>Untitled Document</title>
      <style>
        .video-js {
          height: 344px;
          width: 610px;
        }
        .vjs-my-custom-modal .vjs-modal-dialog-content {
          color: red;
          margin-top: 40px;
          margin-left: 40px;
        }
      </style>

    </head>

    <body>

      <video id="myPlayerID"
        data-account="1507807800001"
        data-player="HJLWns1Zbx"
        data-embed="default"
        data-application-id
        class="video-js"
        controls></video>
      <script src="//players.brightcove.net/1507807800001/HJLWns1Zbx_default/index.min.js"></script>

      <script type="text/javascript">
        videojs('myPlayerID').ready(function(){
        var myPlayer = this,
          options = {};
          options.content = 'In the  modal';
          options.label = 'the label';

          var ModalDialog = videojs.getComponent('ModalDialog');
          var myModal = new ModalDialog(myPlayer, options);
          myModal.addClass('vjs-my-custom-modal');
          myPlayer.addChild(myModal);
          myModal.open();
        });
      </script>
