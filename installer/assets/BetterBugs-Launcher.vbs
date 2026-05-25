Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the installation directory where this VBScript is located
installDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' Launch the PowerShell WPF Control Panel completely invisibly (0 window style)
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -File """ & installDir & "\BetterBugs-ControlPanel.ps1""", 0, False
