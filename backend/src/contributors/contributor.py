from abc import ABC, abstractmethod

class CommandContributor(ABC):

    @abstractmethod
    def get_commands(self):
        pass
    
    # Returns commands every time the palette is opened
    def patch_commands(self):
        return []