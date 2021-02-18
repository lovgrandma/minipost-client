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
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import { resolveString } from '../methods/utility.js';
import placeholderRelated from '../placeholder/relatedobjects.js';
import $ from 'jquery';

export default class RelatedPanel extends Component {
    constructor(props) {
        super(props);
        this.state = { relatedContent: [], loaded: false, fetching: false, bottom: false };
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    componentDidMount() {
        this.fetchRelated();
        window.addEventListener('scroll', this.handleMouseDown);
    }

    componentDidUpdate(prevProps, prevState) {
        try {
            if (prevProps.content != this.props.content) {
                if (this.props.content && !this.fetching) {
                    this.fetchRelated();
                }
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
    
    handleMouseDown() {
        try {
            if (this) {
                if (this.state) {
                    if (utility.checkAtBottom()) {
                        if (!this.state.bottom) {
                            this.setState({ bottom: true });
                            if (this.state.relatedContent && !this.state.fetching) {
                                if (window.location.href.includes("watch")) {
                                    if (this.props.secondary && $('.relatedpanel-secondary').is(':visible')) {
                                        this.fetchRelated();
                                    } else if (!this.props.secondary && $('.relatedpanel-main').is(':visible')) {
                                        this.fetchRelated();
                                    }
                                }
                            }
                        }
                    } else {
                        if (this.state.bottom) {
                            this.setState({ bottom: false });
                        }
                    }
                }
            }
        } catch (err) {
            // Component unmounted. No-op
        }
    }

    fetchRelated = (paginate = 10) => {
        document.getElementsByClassName
        let lastFetch = this.state.lastFetch;
        let run = true;
        if (lastFetch) {
            if (lastFetch > new Date().getTime() - 1000*0.75) { // Only allow fetch 0.75 seconds apart
                run = false;
            }
        }
        if (!this.state.fetching && run) {
            try {
                // Dont allow appending more videos over 50
                if (this.props.content && this.props.contentType && this.state.relatedContent.length < 50) {
                    let id = this.props.content;
                    let type = this.props.contentType;
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
                    this.setState({ lastFetch: new Date().getTime() });
                    this.setState({ fetching: true });
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
                            if (this.state.relatedContent) {
                                if (this.state.relatedContent.length > 0) {
                                    this.state.relatedContent.forEach((content) => {
                                        for (let i = 0; i < data.records.length; i++) {
                                            if (content._fields && data.records[i]._fields) {
                                                if (content._fields[0] && data.records[i]._fields[0]) {
                                                    if (content._fields[0].properties && data.records[i]._fields[0].properties) {
                                                        if (content._fields[0].properties.title == data.records[i]._fields[0].properties.title && content._fields[0].properties.author == data.records[i]._fields[0].properties.author) {
                                                            // console.log("found duplicate");
                                                            // console.log(i);
                                                            data.records.splice(i, 1);
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                            data.records = utility.shuffleArray(data.records);
                            if (this.state.relatedContent.length > 0 && data.records.length > 0) {
                                this.setState({ relatedContent: this.state.relatedContent.concat(data.records)});
                            } else if (this.state.relatedContent.length == 0) {
                                this.setState({ relatedContent: data.records });
                            }
                            if (this.state.relatedContent.length > 0) {
                                this.setState({ loaded: true });
                            }
                            this.setState({ fetching: false });
                        })
                        .catch((err) => {
                            // Error occured while making fetch request
                        });
                } else {
                    this.setState({ fetching: false });
                }
            } catch (err) {
                console.log(err);
                this.setState({ fetching: false });
            }
        }
    }
    
    render() {
        return (
            <div className={this.props.secondary ? 'relatedpanel relatedpanel-secondary' : 'relatedpanel relatedpanel-main'}>
                {
                    this.state.relatedContent.length > 0 ? this.state.relatedContent.map((content, index) =>
                        content._fields[0].properties.mpd ?
                            <Videos mpd={content._fields[0].properties.mpd.toString()}
                            title={content._fields[0].properties.title}
                            description={content._fields[0].properties.description}
                            thumbnailUrl={content._fields[0].properties.thumbnailUrl}
                            author={resolveString(content._fields[0].properties.author)}
                            published={resolveString(content._fields[0].properties.publishDate)}
                            views={utility.getNumber(content._fields[0].properties.views)}
                            articles={content._fields[0].properties.articles}
                            tags={content._fields[0].properties.tags}
                            cloud={this.props.cloud}
                            related={true}
                            key={index}
                            index={index}
                            />
                        : <ArticlePreview title={content._fields[0].properties.title}
                            author={content._fields[0].properties.author}
                            body={content._fields[0].properties.body}
                            id={content._fields[0].properties.id}
                            reads={content._fields[0].properties.reads}
                            published={resolveString(content._fields[0].properties.publishDate)}
                            key={index}
                            related={true}
                            />
                         )
                    : placeholderRelated.map((content, index) => 
                        <Videos title={content.title}
                        author={content.author}
                        views={content.views}
                        published={content.published}
                        placeholder={true}
                        related={true}
                        key={index}
                        />
                    )
                }
                {
                    this.state.relatedContent.length > 0 ?
                        this.state.loaded && !this.state.fetching ?
                            <Button className="flex-button-center-btn" onClick={(e)=>{this.fetchRelated()}}>More videos</Button> : <div ref={this.spinnerRef} className="spinner-search-holder-visible spinner-video-dash"><div className="loadingio-spinner-dual-ball-m6fvn6j93c loadingio-spinner-dual-ball-m6fvn6j93c-dash"><div className="ldio-oo3b7d4nmnr ldio-oo3b7d4nmnr-dash">
                            <div></div><div></div><div></div>
                            </div></div>
                        </div>
                    : null
                }
            </div>
        )
    }
}
