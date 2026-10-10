import { Component, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

/** Catches WebGL and render errors so the encounter UI never goes blank. */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('clinic-3d: scene failed, showing static fallback', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
