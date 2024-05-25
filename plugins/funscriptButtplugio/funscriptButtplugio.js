(function () {
  "use strict";

  try {
    stash.getVersion();
  } catch (e) {
    console.error(
      "Stash not loaded - please install 1. stashUserscriptLibrary from CommunityScripts"
    );
  }

  stash.addEventListener("page:scene", async () => {
    let actions = [];

    const updateVibe = async (player) => {
      if (player.paused) {
        for (const device of window.buttplug_devices) {
          try {
            await device.stop();
          } catch (e) {
            console.log(e);
            if (e instanceof buttplug.ButtplugDeviceError) {
              console.log("got a device error!");
            }
          }
        }
        return;
      }

      for (let i = 0; i < actions.length - 1; i++) {
        const t0 = actions[i].at;
        const p0 = actions[i].pos;
        const t1 = actions[i + 1].at;
        const p1 = actions[i + 1].pos;

        const curTime = player.currentTime;

        if (curTime < t0) {
          break;
        }

        if (t1 < curTime) {
          continue;
        }

        const pos = p0 + ((curTime - t0) * (p1 - p0)) / (t1 - t0);
        //console.log({ at: curTime, pos: pos });

        //console.log(window.buttplug_devices)

        for (const device of window.buttplug_devices) {
          // If we aren't working with a toy that vibrates, just skip.
          if (device.vibrateAttributes.length == 0) {
            continue;
          }

          try {
            await device.vibrate(1.0 - pos / 100.0);
          } catch (e) {
            console.log(e);
            if (e instanceof buttplug.ButtplugDeviceError) {
              console.log("got a device error!");
            }
          }
        }

        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      await updateVibe(player);
    };

    waitForElementClass("scene-file-info", async () => {
      const a = getElementByXpath(
        "//dt[text()='Funscript']/following-sibling::dd/a"
      );
      if (a) {
        console.log(a);

        const response = await fetch(a.href);
        console.log(response);

        const funscript = await response.json();
        console.log(funscript);

        actions = funscript.actions.map((val) => {
          return { at: val.at / 1000.0, pos: val.pos };
        });
      }
    });

    waitForElementId("VideoJsPlayer_html5_api", async (elementId, player) => {
      console.log(player);

      player.addEventListener("play", async (evt) => {
        await updateVibe(player);
      });
    });
  });
})();
