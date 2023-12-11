import subprocess
import platform


def run_powershell_command(command: str, sudo: bool = False):
    if platform.system() != "Windows":
        print("This function can only be run on Windows.")
        return

    if sudo:
        escaped_command = command.replace('"', '`"')
        command = f"powershell -Command \"Start-Process PowerShell -Verb RunAs -ArgumentList '{escaped_command}'\""
    else:
        command = f'powershell.exe -Command "{command}"'

    process = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True)
    output, error = process.communicate()

    if error:
        print(f"Error: {error}")
    else:
        print(f"Output: {output.decode().strip()}")


def wsl_vpn_fix():
    run_powershell_command(
        command='Get-NetAdapter | Where-Object {$_.InterfaceDescription -Match "Cisco AnyConnect"} | Set-NetIPInterface -InterfaceMetric 6000',
        sudo=True,
    )
