import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

// Will remove all link nodes from body of html
function transform(node) {
    if (node.name === 'a') {
        return null;
    }
}

const parseBody = function(body, length, removeLinks = false) {
    if (body) {
        let options = {};
        if (removeLinks) {
            options = { transform };
        }
        let html = "";
        if (length) {
            if (body.length < length) {
                html = ReactHtmlParser(body, options);
            } else {
                html = ReactHtmlParser(body.slice(0, length), options);
                if (html[html.length-1].props) {
                    if (html[html.length-1].type != "figure") { // If last node type figure do not add ellipsis will produce undefined text
                        html[html.length-1].props.children[0] += "..";
                    }
                }
            }
        } else {
            html = ReactHtmlParser(body);
        }
        return html;
    }
    return body;
}

export const countBody = function(body) {
    if (body) {
        let i = 0;
        function transform(node) {
            let halve = false;
            if (node.data) {
                if (node.parent) {
                    if (node.parent.name) {
                        if (node.parent.name == 'code') {
                            halve = true;
                        }
                    }
                }
                let data = node.data.split(" ");
                if (halve) {
                    i += data.length/2;
                } else {
                    i += data.length;
                }
            }
        }
        let options = { transform };
        let html = ReactHtmlParser(body, options);
        if (i > 200) {
            return i;
        } else {
            return 200;
        }
    }
    return 200;
}

export default parseBody;
