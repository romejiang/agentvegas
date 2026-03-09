import { computed } from 'vue'

export const useAgentAuth = () => {
    const route = useRoute()

    // Initialize state from route query once on the client or server
    const observerToken = useState<string>('observerToken', () => (route.query.token as string) || '')

    const isObserverMode = computed(() => !!observerToken.value)

    return {
        observerToken,
        isObserverMode
    }
}
