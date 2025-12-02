import { Component } from "react"

export default class RouterErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error("App error:", error, info) }

  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:24, fontFamily:"system-ui"}}>
          <h1>Something went wrong.</h1>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
          <button onClick={()=>location.reload()}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}
