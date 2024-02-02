export function getTermOverlap(searchTerm: string, command: Command) {
    let split_terms = searchTerm.toLowerCase().split(" ");
  
    let word_pool = command.title.toLowerCase().split(" ");
    if ("tags" in command) {
      word_pool = word_pool.concat(command.tags.map((tag) => tag.toLowerCase()));
    }
    word_pool = word_pool.concat(command.description.toLowerCase().split(" "));
  
    let numInPool = 0;
    for (let term of split_terms) {
      if (word_pool.some((word) => word.startsWith(term))) {
        numInPool++;
      }
    }
  
    return numInPool;
}
  
export function compareCommands(
    lastUsedList: string[],
    searchTerm: string
    ): ((a: Command, b: Command) => number) | undefined {
    return (a, b) => {
    let aIndex = lastUsedList.indexOf(a.title);
    let bIndex = lastUsedList.indexOf(b.title);

    // If equally matched rank, sort by whichever has the search term first
    if (aIndex === bIndex) {
        let aSearchScore = getTermOverlap(searchTerm, a);
        let bSearchScore = getTermOverlap(searchTerm, b);

        return bSearchScore - aSearchScore;
    }

    if (aIndex === -1) {
        return 1;
    } else if (bIndex === -1) {
        return -1;
    } else {
        return aIndex - bIndex;
    }
    };
}

