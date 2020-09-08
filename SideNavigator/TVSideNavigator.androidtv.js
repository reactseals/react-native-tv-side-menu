/* eslint-disable no-use-before-define */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TVEventHandler,
  PixelRatio,
  Dimensions,
  Animated,
} from 'react-native';
import { ScreenContainer } from 'react-native-screens'; //eslint-disable-line
import debounce from 'lodash.debounce';
import LinearGradient from 'react-native-linear-gradient';
import { withTheme } from 'react-native-paper';
import { isPlatformTvos } from 'renative';
import ResourceSavingScene from './ResourceSavingScene';
import Overlay from './Overlay';
import TVFocusGuideView from '../components/FocusGuideView';
import { setFocusTo } from '../utils';

const DEBOUNCE_TIME = isPlatformTvos ? 200 : 50;
const { height } = Dimensions.get('screen');

const styles = StyleSheet.create({
  container: {
    // backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    flex: 1,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
});

const Ratio = (pixels) => {
  const resolution = height * PixelRatio.get();

  return Math.round(
    pixels /
      (resolution < 2160 && Platform.isTV && Platform.OS === 'android' ? 2 : 1)
  );
};

const timing = (
  animatedValue,
  toValue,
  duration = 150,
  useNativeDriver = true
) =>
  Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver,
  });

// eslint-disable-next-line max-statements
function TVSideNavigator({
  drawerContent,
  fixedDrawerContent,
  state: navState,
  navigation,
  descriptors,
  drawerContentOptions,
  drawerStyle,
  overlayStyle,
  hideIn,
  hideDrawerShadowIn,
  theme,
}) {
  const { name: activeRoute } = navState.routes[navState.index];
  const { widthOpened, widthClosed } = drawerStyle || {};
  let tvEventHandler = null;

  const [state, _setState] = useState({
    drawerOpen: false,
    focusable: false,
    lastFocusedTag: [],
    activeRoute: 'Home',
  });

  const stateRef = useRef(state);
  const setState = (val) => {
    stateRef.current = val;
    _setState(val);
  };

  const focusableItemsTags = useRef({}).current;
  const translateXContent = useRef(new Animated.Value(0)).current;
  const translateXDrawer = useRef(new Animated.Value(-widthOpened)).current;
  const opacityDrawer = useRef(new Animated.Value(isPlatformTvos ? 1 : 0))
    .current;
  const translateXContentInterpolate = translateXContent.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateXDrawerInterpolate = translateXDrawer.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    enableEventHandler();
    setState({ ...stateRef.current, focusable: true });

    return () => {
      disableEventHandler();
    };
  }, []);

  useEffect(() => {
    const { name } = navState.routes[navState.index];
    setState({ ...stateRef.current, activeRoute: name });
  }, [navState.index]);

  const enableEventHandler = () => {
    if (!tvEventHandler) {
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(null, (_, evt) => {
        if (evt.eventType === 'focus') {
          handleOnChange(evt);
        }
      });
    }
  };

  const disableEventHandler = () => {
    if (tvEventHandler) {
      tvEventHandler.disable();
      tvEventHandler = null;
    }
  };

  const handleOnChange = useCallback(
    debounce(
      ({ tag }) => {
        if (focusableItemsTags[tag] && stateRef.current.focusable) {
          openDrawer();
        } else {
          closeDrawer(tag);
        }
      },
      DEBOUNCE_TIME,
      { leading: true, trailing: true }
    ),
    []
  );

  const openDrawer = () => {
    Animated.parallel([
      timing(opacityDrawer, 1, 400),
      timing(translateXContent, widthOpened),
      timing(translateXDrawer, 0),
    ]).start();

    if (!stateRef.current.drawerOpen) {
      Object.values(focusableItemsTags).forEach(({ route, tag }) => {
        if (route === stateRef.current.activeRoute) {
          setFocusTo(tag);
        }
      });
      setState({ ...stateRef.current, drawerOpen: true });
    }
  };

  const closeDrawer = (tag) => {
    Animated.parallel([
      timing(opacityDrawer, 0, 100),
      timing(translateXContent, 0),
      timing(translateXDrawer, -widthOpened),
    ]).start();

    if (stateRef.current.drawerOpen) {
      setState({
        ...stateRef.current,
        drawerOpen: false,
        lastFocusedTag: [tag],
      });
    }
  };

  const renderDrawerView = () =>
    drawerContent({
      ...drawerContentOptions,
      state: navState,
      navigation,
      descriptors,
      drawerOpen: state.drawerOpen,
      setFocusableItemTag: (tag, route) => {
        focusableItemsTags[tag] = { tag, route };
      },
      onNavigate: () => {
        closeDrawer();
      },
    });

  const renderFixedDrawerView = () =>
    fixedDrawerContent({
      ...drawerContentOptions,
      state: navState,
      navigation,
      descriptors,
      drawerOpen: state.drawerOpen,
    });

  const renderContent = () => (
    <ScreenContainer style={styles.content}>
      {navState.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const { unmountOnBlur } = descriptor.options;
        const isFocused = navState.index === index;

        if (unmountOnBlur && !isFocused) {
          return null;
        }

        return (
          <ResourceSavingScene
            key={route.key}
            style={[StyleSheet.absoluteFill, { opacity: isFocused ? 1 : 0 }]}
            isVisible={isFocused}
          >
            {descriptor.render()}
          </ResourceSavingScene>
        );
      })}
    </ScreenContainer>
  );
  return (
    <View style={styles.main}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: translateXContentInterpolate }],
          },
        ]}
      >
        <View style={[styles.content]}>{renderContent()}</View>
      </Animated.View>

      {!hideIn.includes(activeRoute) && (
        <>
          <Animated.View
            style={[
              styles.container,
              // drawerStyle,
              {
                width: widthClosed,
                zIndex: 2,
              },
            ]}
          >
            {!state.drawerOpen && !hideDrawerShadowIn?.includes(activeRoute) && (
              <LinearGradient
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
                colors={[
                  theme.colors.navBackground,
                  `${theme.colors.navBackground}CC`,
                  `${theme.colors.navBackground}00`,
                ]}
                style={{
                  height,
                  width: Ratio(200),
                  position: 'absolute',
                  left: Ratio(-50),
                  bottom: 0,
                  zIndex: -1,
                }}
              />
            )}

            {renderFixedDrawerView()}
          </Animated.View>
          <Overlay progress={state.drawerOpen ? 1 : 0} style={overlayStyle} />
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateX: translateXDrawerInterpolate }],
                zIndex: 1,
                opacity: opacityDrawer,
              },
              // drawerStyle,
              { width: widthOpened },
            ]}
          >
            {renderDrawerView()}
          </Animated.View>
        </>
      )}
    </View>
  );
}

export default withTheme(TVSideNavigator);
