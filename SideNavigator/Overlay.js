import * as React from 'react';
import { StyleSheet, Animated } from 'react-native';

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0E1825DA',
    },
});

const opacityValue = new Animated.Value(0);

const Overlay = React.forwardRef(function Overlay({ progress, style, ...props }, ref) {
    React.useEffect(() => {
        Animated.timing(opacityValue, {
            toValue: progress,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [progress]);

    const animatedStyle = {
        opacity: opacityValue,
        zIndex: progress ? 1 : -1,
        display: progress ? 'flex' : 'none',
    };

    return <Animated.View {...props} ref={ref} style={[styles.overlay, animatedStyle, style]} />;
});

export default Overlay;
