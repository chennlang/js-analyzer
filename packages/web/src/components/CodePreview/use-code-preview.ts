import { createApp } from 'vue';
import CodePreview from './CodePreview.vue'

export function useCodePreview() {
    function openCodePreview(file: string, propsData: any = {}) {
        const container = document.getElementById('preview') || document.createElement('div');
        document.body.appendChild(container);

        const remove = () => {
            document.body.removeChild(container);
        };

        const vm = createApp(CodePreview, {
            show: true,
            file,
            remove,
            ...propsData,
        })
        vm.mount(container)
        return remove;
    };
    return {
        openCodePreview,
    }
}