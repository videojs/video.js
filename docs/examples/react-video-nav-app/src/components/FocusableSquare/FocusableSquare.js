import React, { useRef, useEffect } from "react";
import './FocusableSquare.css';

const FocusableSquare = ({ focused, setRef }) => {
    // const focusableSquareNode = useRef();

    // useEffect(() => {
    //     if (focused && focusableSquareNode) {
    //         focusableSquareNode.current.focus();
    //     }
    // }, [focused]);

    return (
        <div tabIndex="0" className={"focusable_square"} ref={setRef} ></div>
    );
};

export default FocusableSquare;
