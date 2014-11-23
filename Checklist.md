Google Checklist- 
=================
<br>
<h2>General</h2>
<br>
X - The add-on must be fully functional — it can't be a “work in progress.”<br>
X - The script has been tested with multiple active users.<br>
:) - The design adheres to the UI style guide.<br>

<h2>Technical</h2><br>

:) - The add-on script is bound to a Sheets, Docs, or Forms file.<br>
:) - The script's project name is the same as the name intended for publication. (The script name appears in the authorization dialog.)<br>
X - The script has error-handling code and only shows appropriate error messages to the user.<br>
:) - The script does not log debug information to the JavaScript console.<br>
:) and X - The script includes an ‘onInstall(e)’ function that populates the menu (usually by calling ‘onOpen(e)’). All custom menu items must be place under the “Add-ons” tab.<br>
:) - To comply with the limitations of the no-authorization mode, the script's global code and the ‘AuthMode.NONE’ path of the ‘onOpen(e)’ function should not contain calls to services that require authentication.
<br>
:) - The script does not use server-side libraries, which can cause the add-on to run slowly.