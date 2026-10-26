# Frontend interaction acceptance

## AKG-27 · Optional menu haptics

A single 8 ms Vibration API request follows trusted activation of the mobile menu summary on coarse-pointer devices. Native details behavior remains independent; no load, hover, focus, scroll, or programmatic-toggle haptics. Reduced motion suppresses the pulse. Ticket links and other CTAs deliberately do not vibrate.

Browser support is not a hardware guarantee: Safari/iOS does not support the Vibration API; current Firefox also does not. Chromium/Android support still requires user activation, available hardware and OS/browser permission. No iOS workarounds, dependencies or persistent preferences. No physical vibration has been verified here.

Sources checked during implementation:

- [MDN: Navigator.vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) — sticky user activation and duration semantics.
- [MDN: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) — progressive enhancement.
- [Can I use: Vibration API](https://caniuse.com/vibration) — Safari/iOS and Firefox limitations.
