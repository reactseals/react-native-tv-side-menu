/* eslint-disable */
import React from 'react';
import { findNodeHandle, requireNativeComponent, Platform, View } from 'react-native';

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView');

class TVFocusGuideView extends React.Component {
    componentDidUpdate() {
        const destinations = this.props.destinations || [];
        this._destinationTags = destinations.map(c => 
             typeof c === 'object' ? findNodeHandle(c) : c
        );
        this.focusGuideRef &&
            this.focusGuideRef.setNativeProps({
                destinationTags: this._destinationTags,
            });
    }

    focusGuideRef = null;

    _destinationTags = [];

    render() {
        if (Platform.isTVOS) {
            return (
                <View style={[{ minHeight: 1, minWidth: 1 }, this.props.style]}>
                    <RNFocusGuide
                        style={this.props.style}
                        ref={ref => (this.focusGuideRef = ref)}
                        destinationTags={this._destinationTags}
                    >
                        {this.props.children}
                    </RNFocusGuide>
                </View>
            );
        }
        return <React.Fragment />;
    }
}

export default TVFocusGuideView;
