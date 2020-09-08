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
import { BlurView } from '@react-native-community/blur';
import ResourceSavingScene from './ResourceSavingScene';
import Overlay from './Overlay';
import TVFocusGuideView from '../../components/FocusGuideView';
import { setFocusTo } from '../../core/utils';

const DEBOUNCE_TIME = 40;
const { height } = Dimensions.get('screen');

const styles = StyleSheet.create({
  container: {
    // backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
  overlayStyle: {
    left: 400,
    position: 'absolute',
  },
  gradient: {
    height,
    width: 200,
    position: 'absolute',
    left: -50,
    bottom: 0,
    zIndex: -1,
  },
});

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
    activeRoute: 'Home',
  });

  const stateRef = useRef(state);
  const setState = (val) => {
    stateRef.current = val;
    _setState(val);
  };

  const focusableItemsTags = useRef({}).current;
  const drawerViewRef = useRef(null);
  const opacityDrawer = useRef(new Animated.Value(1)).current;
  const lastFocusedTag = useRef([]).current;

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
        // Focused tag is a menu item and the drawe should be able to open
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
    if (!stateRef.current.drawerOpen) {
      Object.values(focusableItemsTags).forEach(({ route, tag }) => {
        if (route === stateRef.current.activeRoute) {
          // Set has TV preffered focus on a ref
          setFocusTo(tag);
        }
      });
      setState({ ...stateRef.current, drawerOpen: true });
    }
  };

  const closeDrawer = (tag) => {
    // Save last focused tag
    lastFocusedTag.current = [tag];
    // Animate - close drawer
    drawerViewRef.current.setNativeProps({
      transform: [{ translateX: -400 }],
    });
    if (stateRef.current.drawerOpen) {
      setState({ ...stateRef.current, drawerOpen: false });
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
        closeDrawer(lastFocusedTag.current[0]);
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
      <Animated.View style={[styles.content]}>
        <View style={[styles.content]}>
          <TVFocusGuideView
            style={{
              width: 400,
              height: '100%',
              left: 400,
              position: 'absolute',
              zIndex: 999,
            }}
            destinations={lastFocusedTag.current}
          />
          {renderContent()}
        </View>
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
            {!state.drawerOpen &&
              !hideDrawerShadowIn?.includes(activeRoute) && (
                <LinearGradient
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 1 }}
                  colors={[
                    theme.colors.navBackground,
                    `${theme.colors.navBackground}CC`,
                    `${theme.colors.navBackground}00`,
                  ]}
                  style={styles.gradient}
                />
              )}
            {state.drawerOpen && (
              <LinearGradient
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
                colors={[
                  theme.colors.navBackground,
                  `${theme.colors.navBackground}CC`,
                  `${theme.colors.navBackground}00`,
                ]}
                style={[styles.gradient, { top: 200 }]}
              />
            )}

            {renderFixedDrawerView()}
          </Animated.View>
          {/* <Overlay progress={1} style={[styles.overlayStyle, overlayStyle]} /> */}
          <Animated.View
            ref={drawerViewRef}
            style={[
              styles.container,
              {
                transform: [{ translateX: -400 }],
                zIndex: 1,
                opacity: opacityDrawer,
              },
              { width: widthOpened },
            ]}
          >
            <BlurView
              style={styles.absolute}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor="black"
            />
            {renderDrawerView()}
          </Animated.View>
        </>
      )}
    </View>
  );
}

export default withTheme(TVSideNavigator);
