import { ref } from 'vue';

let index = 999

export function useIndex () {
    const zIndex = ref(index)

    function getZIndex() {
        index += 1
        zIndex.value = index
    }
    return {
        zIndex,
        getZIndex,
    }
}