import React, { Component } from 'react';
import currentrooturl from '../url.js';
import utility from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';

export default class RelatedPanel extends Component {
    constructor(props) {
        super(props);
        this.state = { relatedContent: [] };
    }

    componentDidMount() {
        this.fetchRelated();
    }

    componentDidUpdate(prevProps, prevState) {
        try {
            if (prevProps.content != this.props.content) {
                this.fetchRelated();
            }
        } catch (err) {
            // Component may have unmounted
        }
    }

    componentDidCatchError(error, errorInfo) {
        console.log(error);
    }

    componentWillUnmount() {
        
    }

    fetchRelated = () => {
        try {
            if (this.props.content && this.props.contentType) {
                let id = this.props.content;
                let type = this.props.contentType;
                let paginate = 10;
                let title = '';
                if (this.props.title) {
                    title = this.props.title;
                }
                if (this.state.relatedContent.length > 10) {
                    paginate = this.state.relatedContent.length + 10;
                }
                if (id.match(/https:\/\/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)) {
                    id = id.match(/https:\/\/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)[2];
                }
                fetch(currentrooturl + 'm/getRelated', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            id, type, paginate, title
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        let related = [];
                        if (utility.get(data, 'records')) {
                            for (let i = 0; i < data.records.length; i++) {
                                related.push(data.records[i]._fields);
                            }
                        }
                        this.setState({ relatedContent: related });
                    })
                    .catch((err) => {
                        // Error occured while making fetch request
                    });
            }
        } catch (err) {
            console.log(err);
        }
    }
    
    render() {
        return (
            <div className='relatedpanel'>
                
            </div>
        )
    }
}
