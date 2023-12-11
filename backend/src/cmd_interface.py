import subprocess
import platform


def run_powershell_command(command: str):
    if platform.system() != "Windows":
        print("This function can only be run on Windows.")
        return

    powershell_command = ["powershell.exe", "-Command", command]

    process = subprocess.Popen(powershell_command, stdout=subprocess.PIPE)
    output, error = process.communicate()

    if error:
        print(f"Error: {error}")
    else:
        print(f"Output: {output.decode().strip()}")


def wsl_vpn_fix():
    run_powershell_command(
        # "Get-NetIPInterface | Where-Object {$_.InterfaceAlias -eq 'vEthernet (WSL)'} | Set-NetIPInterface -InterfaceMetric 1"
        command='echo "Hello, World!"'
    )
