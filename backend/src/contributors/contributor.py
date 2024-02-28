from abc import ABC, abstractmethod

class CommandContributor(ABC):

    @abstractmethod
    def get_commands(self):
        pass