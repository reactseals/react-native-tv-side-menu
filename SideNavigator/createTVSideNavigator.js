import * as React from 'react';
import {
    useNavigationBuilder,
    StackActions,
    StackRouter,
    createNavigatorFactory,
} from '@react-navigation/native';
import {
    screensEnabled,
    // eslint-disable-next-line import/no-unresolved
} from 'react-native-screens';

import TVSideNavigator from './TVSideNavigator';

function Navigator({ initialRouteName, children, screenOptions, ...rest }) {
    if (!screensEnabled()) {
        throw new Error('Native stack is only available if React Native Screens is enabled.');
    }

    const { state, navigation, descriptors } = useNavigationBuilder(StackRouter, {
        initialRouteName,
        children,
        screenOptions,
    });

    React.useEffect(
        () =>
            navigation.addListener &&
            navigation.addListener('tabPress', e => {
                const isFocused = navigation.isFocused();

                // Run the operation in the next frame so we're sure all listeners have been run
                // This is necessary to know if preventDefault() has been called
                requestAnimationFrame(() => {
                    if (state.index > 0 && isFocused && !e.defaultPrevented) {
                        // When user taps on already focused tab and we're inside the tab,
                        // reset the stack to replicate native behaviour
                        navigation.dispatch({
                            ...StackActions.popToTop(),
                            target: state.key,
                        });
                    }
                });
            }),
        [navigation, state.index, state.key]
    );

    return (
        <TVSideNavigator
            {...rest}
            state={state}
            descriptors={descriptors}
            navigation={navigation}
        />
    );
}

export const createTVSideNavigator = createNavigatorFactory(Navigator);
