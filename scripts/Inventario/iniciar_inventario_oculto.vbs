' Lanza auto_arranque_colbeef.bat desde la misma carpeta que este .vbs, sin mostrar consola.
' Use un acceso directo a ESTE archivo en Inicio de Windows para arranque silencioso.

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\auto_arranque_colbeef.bat"

Set sh = CreateObject("WScript.Shell")
' 0 = ventana oculta
sh.Run "cmd.exe /c """ & batPath & """ /servicio", 0, False
Set sh = Nothing
Set fso = Nothing
