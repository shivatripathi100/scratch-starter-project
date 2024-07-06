import React, { useEffect, useState } from "react";
import CatSprite from "../CatSprite";
import "./style.css";
import { useSelector } from "react-redux";
import { spriteActions } from "../../store/sprite-slice";
import { useDispatch } from "react-redux";
import { spriteStyleActions } from "../../store/sprite_style_slice";
import { selectedSpriteActions } from "../../store/selected_sprite_slice";
import { v4 as uuid } from "uuid";
import { blocks } from "../../contants/blocks";

export default function PreviewArea() {
  const selectedSpriteId = useSelector(
    (state) => state.selectedStripe.stripeId
  );
  const allStripes = useSelector((state) => state.sprite.sprites);
  const spriteStyles = useSelector((state) => state.spriteStyle.sprites);
  const isSpriteRunning = useSelector(
    (state) => state.selectedStripe.isSpriteRunning
  );
  const [spritesStyleObject, setSpriteStyle] = useState(spriteStyles);
  const [spriteCSS, setSpriteCss] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);

  window.onkeypress = function (event) {
    const actionIndex = allStripes.findIndex(({ spriteId }) => {
      return spriteId === selectedSpriteId;
    });

    let selectedActions = allStripes[actionIndex]?.actions;
    const index = selectedActions?.findIndex(({ action }) => action === "events");

    if (index === -1) return;

    const eventAction = selectedActions[index];

    const action = blocks["events"];
    const actionId = action.findIndex(({ id }) => eventAction.blockId === id);
    const actionPerformed = action[actionId];

    if (actionPerformed.action === "Key") {
      if (actionPerformed.key === "space" && event.which === 32) {
        startStripe();
      }
    }
  };

  const dispatch = useDispatch();

  function looks(actions, selectedSprite) {
    const action = blocks[actions.action];
    const actionId = action.findIndex(({ id }) => actions.blockId === id);
    const actionPerformed = action[actionId];
    let modifiedStyle = {};
    let timeout = 0;
    let revertAction = "";
  
    if (actionPerformed.action === "Say") {
      modifiedStyle = { ...selectedSprite, isSaying: true, word: actionPerformed.word };
      timeout = actionPerformed.duration;
      revertAction = "isSaying";
    } else if (actionPerformed.action === "Think") {
      modifiedStyle = { ...selectedSprite, isThinking: true };
      timeout = actionPerformed.duration;
      revertAction = "isThinking";
    }
  
    return { modifiedStyle, timeout, revertAction };
  }
  

  async function control(actions, selectedSprite) {
    const action = blocks[actions.action];
    const actionId = action.findIndex(({ id }) => actions.blockId === id);
    const actionPerformed = action[actionId];
    if (actionPerformed.action === "Wait") {
      await sleepNow(actionPerformed.count);
    }
  }

  const sleepNow = (delay) =>
    new Promise((resolve) => setTimeout(resolve, delay));

  async function startStripe() {
    setActionHistory([]); 

    const cssIndex = spriteCSS.findIndex(({ spriteId }) => spriteId === selectedSpriteId);
    const actionIndex = allStripes.findIndex(({ spriteId }) => spriteId === selectedSpriteId);

    let selectedCss = spriteCSS[cssIndex];
    let selectedActions = allStripes[actionIndex]?.actions;

    if (!selectedActions || selectedActions.length === 0) return;
    if (isSpriteRunning) return;

    dispatch(selectedSpriteActions.startSprite());

    for (let i = 0; i < selectedActions.length; i++) {
      await sleepNow(1000);
      const actionPerformed = selectedActions[i].action;

      
      setActionHistory((prevHistory) => [...prevHistory, selectedActions[i]]);

      if (actionPerformed === "motion") {
        const modifiedStyle = motion(selectedActions[i], selectedCss);
        const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle[0].spriteId);
        let tempArray = [...spriteCSS];
        tempArray[index].style = { ...modifiedStyle[0].style };
        setSpriteCss(tempArray);
      } else if (actionPerformed === "looks") {
        const { modifiedStyle, timeout, revertAction } = looks(selectedActions[i], selectedCss);
        const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle.spriteId);
        let tempArray = [...spriteCSS];
        tempArray[index] = { ...modifiedStyle };
        setSpriteCss(tempArray);
        setTimeout(() => {
          const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle.spriteId);
          tempArray[index][`${revertAction}`] = false;
          setSpriteCss(tempArray);
        }, timeout * 1000);
      } else if (actionPerformed === "control") {
        control(selectedActions[i], selectedCss);
      }
    }

    dispatch(selectedSpriteActions.stopSprite());
  }

  const replayHistory = async () => {
    if (isSpriteRunning) return; 

    dispatch(selectedSpriteActions.startSprite());

    for (let i = 0; i < actionHistory.length; i++) {
      await sleepNow(1000); 
      const actionPerformed = actionHistory[i].action;

      if (actionPerformed === "motion") {
        const modifiedStyle = motion(actionHistory[i], spriteCSS.find(({ spriteId }) => spriteId === selectedSpriteId));
        const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle[0].spriteId);
        let tempArray = [...spriteCSS];
        tempArray[index].style = { ...modifiedStyle[0].style };
        setSpriteCss(tempArray);
      } else if (actionPerformed === "looks") {
        const { modifiedStyle, timeout, revertAction } = looks(actionHistory[i], spriteCSS.find(({ spriteId }) => spriteId === selectedSpriteId));
        const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle.spriteId);
        let tempArray = [...spriteCSS];
        tempArray[index] = { ...modifiedStyle };
        setSpriteCss(tempArray);
        setTimeout(() => {
          const index = spriteCSS.findIndex(({ spriteId }) => spriteId === modifiedStyle.spriteId);
          tempArray[index][`${revertAction}`] = false;
          setSpriteCss(tempArray);
        }, timeout * 1000);
      } else if (actionPerformed === "control") {
        control(actionHistory[i], spriteCSS.find(({ spriteId }) => spriteId === selectedSpriteId));
      }
    }

    dispatch(selectedSpriteActions.stopSprite());
  };

  useEffect(() => {
    let styledArray = [];
    spritesStyleObject.forEach(({ top, bottom, left, right, angle, spriteId, isSaying, isThinking }) => {
      styledArray.push({
        spriteId,
        isSaying,
        isThinking,
        style: {
          left,
          right,
          top,
          bottom,
          transform: `rotate(${angle}deg)`,
        },
      });
    });
    setSpriteCss((prevArray) => [...prevArray, ...styledArray]);
  }, []);

  function motion(actions, selectedSprite) {
    const action = blocks[actions.action];
    const actionId = action.findIndex(({ id }) => actions.blockId == id);
    const actionPerformed = action[actionId];
  
    let currentStyle = { ...selectedSprite.style };
    let modifiedStyle = { ...currentStyle };
  
    if (actionPerformed.action === 'Move') {
      modifiedStyle.left += actionPerformed.count;
    } else if (actionPerformed.action === 'Turn') {
      let currentAngle = parseFloat(selectedSprite.style.transform.slice(7).slice(0, -4));
      let newAngle = currentAngle;
  
      if (actionPerformed.direction === 'anticlockwise') {
        newAngle -= actionPerformed.count;
        if (newAngle < 0) newAngle += 360; 
      } else { 
        newAngle += actionPerformed.count;
        newAngle %= 360; 
      }
  
      modifiedStyle = {
        ...currentStyle,
        transform: `rotate(${newAngle}deg)`
      };
    }
  
    return [{
      spriteId: selectedSprite.spriteId,
      style: modifiedStyle
    }];
  }
  
  
  const addSprite = () => {
    const unique_id = uuid().slice(0, 8);
    dispatch(spriteStyleActions.addSprite({ unique_id }));
    dispatch(spriteActions.addStripe({ unique_id }));
    dispatch(selectedSpriteActions.setSelectedSprite({ spriteId: unique_id }));

    const newSprite = {
      spriteId: unique_id,
      isSaying: false,
      isThinking: false,
      style: {
        left: 30,
        right: 0,
        top: 30,
        bottom: 0,
        transform: `rotate(0deg)`,
      },
    };

    setSpriteCss((preState) => [...preState, newSprite]);
  };

  const selectSprite = (id) => {
    dispatch(selectedSpriteActions.setSelectedSprite({ spriteId: id }));
  };

  return (
    <div className="preview-field-div h-full overflow-y-auto p-2">
      <div className="preview-field">
        {spriteCSS &&
          spriteCSS.map(({ spriteId, style, isSaying, isThinking }) => (
            <div key={spriteId} className="stripe-image" onClick={() => selectSprite(spriteId)} style={style}>
              {isSaying ? <div className="cloud-say">hello</div> : null}
              {isThinking ? <div className="cloud-think">Hmmm...</div> : null}
              <CatSprite />
            </div>
          ))}
        <button onClick={startStripe} className="run-sprite">
          Run
        </button>
        <button onClick={addSprite} className="add-sprite">
          Add Sprite
        </button>
        <button onClick={replayHistory} className="replay-actions">
          Replay Actions
        </button>
      </div>
    </div>
  );
}  