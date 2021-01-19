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
            <div className={this.props.secondary ? 'relatedpanel relatedpanel-secondary' : 'relatedpanel relatedpanel-main'}>
                {
                    this.state.relatedContent.length > 0 ? this.state.relatedContent.map((content, index) =>
                        content[0].properties.mpd ?
                            <Videos mpd={content[0].properties.mpd.toString()}
                            title={content[0].properties.title.toString()}
                            description={content[0].properties.description}
                            thumbnailUrl={content[0].properties.thumbnailUrl}
                            author={content[0].properties.author.toString()}
                            published={content[0].properties.publishDate.toString()}
                            views={utility.getNumber(content[0].properties.views)}
                            articles={content[0].properties.articles}
                            tags={content[0].properties.tags}
                            cloud={this.props.cloud}
                            related={true}
                            key={index}
                            index={index}
                            />
                        : <ArticlePreview title={content.properties.title}
                            author={content.properties.author}
                            body={content.properties.body}
                            id={content.properties.id}
                            likes={content.properties.likes}
                            dislikes={content.properties.dislikes}
                            reads={content.properties.reads}
                            published={content.properties.publishDate}
                            key={index}
                            related={true}
                            />
                         )
                    : null
                }
            </div>
        )
    }
}
