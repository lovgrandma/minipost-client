export const setResponseToParentPath = function() {
    if (this.state.responseTo) {
        if (this.state.responseTo.type == "video" && this.state.responseTo.mpd) {
            return {
                pathname:`/watch?v=${this.state.responseTo.mpd}`
            }
        } else if (this.state.responseTo.type == "article" && this.state.responseTo.id) {
            return {
                pathname:`/read?a=${this.state.responseTo.id}`
            }
        }
    }
    return {
        pathname:`/`
    }
}
