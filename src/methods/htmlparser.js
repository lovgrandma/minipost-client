import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

const parseBody = function(body, length) {
    if (body) {
        let html = "";
        if (length) {
            if (body.length < length) {
                html = ReactHtmlParser(body);
            } else {
                html = ReactHtmlParser(body.slice(0, length));
                html[0].props.children[0] += "..";
            }
        } else {
            html = ReactHtmlParser(body);
        }
        return html;
    }
    return body;
}

export default parseBody;
