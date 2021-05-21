import React, { Component } from 'react';
import currentrooturl from '../../url.js';
import parseBody from '../../methods/htmlparser.js';
import corsdefault from '../../cors.js';

// append entire data from server into react component, more dynamic

export default class DashHello extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageContent: null, pageJs: null, pageTyped: null
        }
    }

    componentDidMount() {
        this.fetchPageContent();
    }

    fetchPageContent() {
        try {
            this.trySetTyped();
            fetch(currentrooturl + 'm/fetchdashhello', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        
                    })
                })
                .then((response) => {
                    return response.text();
                })
                .then((result) => {
                    if (result) {
                        // Filter using regex to separate html/style from script
                        if (result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)) {
                            if (result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)[1] && result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)[4]) {
                                this.setState({ pageContent: result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)[1] });
                                this.setState({ pageJs: result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)[3] });
                                this.trySetScript(result.match(/([\s\S]*)(<script>)([\s\S]*)(<\/script>)/)[3]);
                            }
                        }
                    }
                    return true;
                })
                .catch((err) => {
                    return false; // Fail silently
                })
        } catch (err) {
            // Fail silently
        }
    }

    trySetScript(pageScript) {
        try {
            const script = document.createElement('script');
            script.text = eval(pageScript);
            script.async = true;
            document.getElementsByClassName('dashHello')[0].appendChild(script);
        } catch (err) {
            // Fail silently
        }
    }

    trySetTyped() {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/typed.js@2.0.12";
        script.async = true;
        document.getElementsByClassName('dashHello')[0].appendChild(script);
    }

    render() {
        return (
            <div className="dashHello">
                {
                    this.state.pageContent ? parseBody(this.state.pageContent) : null
                }
            </div>
        )
    }
}