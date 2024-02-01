# Attribs: https://pythonassets.com/posts/extract-icon-from-executable-file-windows/

from ctypes import Array, byref, c_char, memset, sizeof
from ctypes import c_int, c_void_p, POINTER
from ctypes.wintypes import *
from enum import Enum
import ctypes

from PIL import Image


BI_RGB = 0
DIB_RGB_COLORS = 0


class ICONINFO(ctypes.Structure):
    _fields_ = [
        ("fIcon", BOOL),
        ("xHotspot", DWORD),
        ("yHotspot", DWORD),
        ("hbmMask", HBITMAP),
        ("hbmColor", HBITMAP),
    ]


class RGBQUAD(ctypes.Structure):
    _fields_ = [
        ("rgbBlue", BYTE),
        ("rgbGreen", BYTE),
        ("rgbRed", BYTE),
        ("rgbReserved", BYTE),
    ]


class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [
        ("biSize", DWORD),
        ("biWidth", LONG),
        ("biHeight", LONG),
        ("biPlanes", WORD),
        ("biBitCount", WORD),
        ("biCompression", DWORD),
        ("biSizeImage", DWORD),
        ("biXPelsPerMeter", LONG),
        ("biYPelsPerMeter", LONG),
        ("biClrUsed", DWORD),
        ("biClrImportant", DWORD),
    ]


class BITMAPINFO(ctypes.Structure):
    _fields_ = [
        ("bmiHeader", BITMAPINFOHEADER),
        ("bmiColors", RGBQUAD * 1),
    ]


shell32 = ctypes.WinDLL("shell32", use_last_error=True)
user32 = ctypes.WinDLL("user32", use_last_error=True)
gdi32 = ctypes.WinDLL("gdi32", use_last_error=True)

gdi32.CreateCompatibleDC.argtypes = [HDC]
gdi32.CreateCompatibleDC.restype = HDC
gdi32.GetDIBits.argtypes = [HDC, HBITMAP, UINT, UINT, LPVOID, c_void_p, UINT]
gdi32.GetDIBits.restype = c_int
gdi32.DeleteObject.argtypes = [HGDIOBJ]
gdi32.DeleteObject.restype = BOOL
shell32.ExtractIconExW.argtypes = [LPCWSTR, c_int, POINTER(HICON), POINTER(HICON), UINT]
shell32.ExtractIconExW.restype = UINT
user32.GetIconInfo.argtypes = [HICON, POINTER(ICONINFO)]
user32.GetIconInfo.restype = BOOL
user32.DestroyIcon.argtypes = [HICON]
user32.DestroyIcon.restype = BOOL


class IconSize(Enum):
    SMALL = 1
    LARGE = 2

    @staticmethod
    def to_wh(size: "IconSize") -> tuple[int, int]:
        """
        Return the actual (width, height) values for the specified icon size.
        """
        size_table = {IconSize.SMALL: (16, 16), IconSize.LARGE: (32, 32)}
        return size_table[size]


def extract_icon(filename: str, size: IconSize) -> Image:
    """
    Extract the icon from the specified `filename`, which might be
    either an executable or an `.ico` file.
    """
    dc: HDC = gdi32.CreateCompatibleDC(0)
    if dc == 0:
        raise ctypes.WinError()

    hicon: HICON = HICON()
    extracted_icons: UINT = shell32.ExtractIconExW(
        filename,
        0,
        byref(hicon) if size == IconSize.LARGE else None,
        byref(hicon) if size == IconSize.SMALL else None,
        1,
    )
    # print(extracted_icons)
    if extracted_icons != 1:
        raise ctypes.WinError()

    def cleanup() -> None:
        if icon_info.hbmColor != 0:
            gdi32.DeleteObject(icon_info.hbmColor)
        if icon_info.hbmMask != 0:
            gdi32.DeleteObject(icon_info.hbmMask)
        user32.DestroyIcon(hicon)

    icon_info: ICONINFO = ICONINFO(0, 0, 0, 0, 0)
    if not user32.GetIconInfo(hicon, byref(icon_info)):
        cleanup()
        raise ctypes.WinError()

    w, h = IconSize.to_wh(size)
    bmi: BITMAPINFO = BITMAPINFO()
    memset(byref(bmi), 0, sizeof(bmi))
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER)
    bmi.bmiHeader.biWidth = w
    bmi.bmiHeader.biHeight = -h
    bmi.bmiHeader.biPlanes = 1
    bmi.bmiHeader.biBitCount = 32
    bmi.bmiHeader.biCompression = BI_RGB
    bmi.bmiHeader.biSizeImage = w * h * 4
    bits = ctypes.create_string_buffer(bmi.bmiHeader.biSizeImage)
    copied_lines = gdi32.GetDIBits(
        dc, icon_info.hbmColor, 0, h, bits, byref(bmi), DIB_RGB_COLORS
    )
    if copied_lines == 0:
        cleanup()
        raise ctypes.WinError()

    # My code
    # Map from BGRA -> RGBA
    # Function to swap red and blue bytes in BGRA to get RGBA
    def swap_red_blue(bgra_buffer, size):
        for i in range(0, size, 4):
            # Swap the red and blue bytes (first and third bytes)
            bgra_buffer[i], bgra_buffer[i + 2] = bgra_buffer[i + 2], bgra_buffer[i]

    # Call the function to modify the bits buffer
    swap_red_blue(bits, bmi.bmiHeader.biSizeImage)

    mode = "RGBA"
    image = Image.frombuffer(mode, (w, h), bits, "raw", mode, 0, 1)

    cleanup()
    return image
