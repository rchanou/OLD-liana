import React from 'react';


export default class Compy extends React.Component {
  static defaultProps = {
    shouldUpdate: o=> true,
    willMount(){},
    didMount(){},
    willUpdate(){},
    didUpdate(){},
    willReceiveProps(){},
    willUnmount(){}
  }

  constructor(props){
    super(props);
    this.state = props.initialState;
  }

  render(){
    const { children } = this.props;
    
    if (typeof children === 'function'){
      return children(
        this.state, this.setState.bind(this), this
      );
    } else {
      return children;
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.props.shouldUpdate(this, nextProps, nextState);
  }

  componentWillMount(){
    this.props.willMount(this, this.setState.bind(this));
  }

  componentDidMount(){
    this.props.didMount(this, this.setState.bind(this));
  }

  componentWillUpdate(nextProps, nextState){
    this.props.willUpdate(this, nextState, this.setState.bind(this));
  }

  componentDidUpdate(){
    this.props.didUpdate(this, this.setState.bind(this));
  }

  componentWillReceiveProps(nextProps){
    this.props.willReceiveProps(this, this.setState.bind(this));
  }

  componentWillUnmount(){
    this.props.willUnmount(this, this.setState.bind(this));
  }
}
