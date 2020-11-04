import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { cookies, socket } from '../App.js';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import parseBody from '../methods/htmlparser.js';
import currentrooturl from '../url.js';
import history from '../methods/history.js';
import { convertDate, get } from '../methods/utility.js';
import greythumb from '../static/greythumb.jpg';


export default class Results extends Component {
    constructor(props) {
        super(props);
        this.state = { content: [], query: "", loaded: false

                     }
    }

    componentDidMount() {
        this.setQuery().then((query) => {
            this.getResults(query);
        })
    }

    // Replace all instances of + with a space
    replaceWith(query) {
        for (let i = 0; i < query.length; i++) {
            if (query.charAt(i) == '+') {
                query = query.replace("+", " ");
            }
        }
        return query;
    }

    // Sets query value as to be easily reference programmatically
    setQuery = async () => {
        try {
            if (window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)) {
                if (window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)[2]) {
                    let query = this.replaceWith(window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)[2])
                    this.setState({ query: query });
                    return query;
                }
            }
        } catch (err) {
            // Something went wrong
        }
    }

    getResults(query) {
        if (query) {
            if (query.length > 0) {
                fetch(currentrooturl + 'm/search?s=' + query, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'same-origin',
                    credentials: 'include'
                })
                .then((response) => {
                    return response.json(); // Parsed data
                })
                .then((data) => {
                    if (data) {
                        if (data.content) {
                            if (data.content.length > 0) {
                                this.setState({ content: data.content, loaded: true });
                            }
                        }
                    }
                    console.log(data);
                    return data;
                })
                .catch(error => {
                    console.log(error);
                })
            }
        }
    }

    render() {
        return (
                this.state.loaded && this.state.content ?
                    <div>
                        <div className="results-showing">Showing results for: {this.state.query}</div>
                        {
                            this.state.content.length > 0 ?
                                this.state.content.map((record, index) =>
                                    <div key={index}>{record.title}</div>
                                )
                            : <div></div>
                        }
                    </div>
                : <div></div>
        )
    }
}
