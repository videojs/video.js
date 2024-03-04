import React, { useRef, useState, useEffect } from "react";
import './FocusableSquares.css';
import FocusableSquare from "../FocusableSquare/FocusableSquare";

const FocusableSquares = (props) => {
    const nodesArray = useRef([]);
    const focusableSquaresRef = useRef(null);

    const getPositionOfFocusedNode = () => {
        const nodesArray_ = nodesArray.current;

        for (let i = 0; i < nodesArray_.length; i++) {
            if (document.activeElement === nodesArray_[i]) {
                return i;
            }
        }
        return null;
    };

    const focusNextSibling = () => {
        const nodesArray_ = nodesArray.current;
        const focusedNode = getPositionOfFocusedNode();

        if (focusedNode !==  null && focusedNode <= (nodesArray_.length - 2)) {
            nodesArray_[focusedNode + 1].focus();
        }
    }

    const focusPreviousSibling = () => {
        const nodesArray_ = nodesArray.current;
        const focusedNode = getPositionOfFocusedNode();

        if (focusedNode !==  null && focusedNode > 0) {
            nodesArray_[focusedNode - 1].focus();
        }
    }

    const tryFocusBelow = () => {
        const focusedNode = getPositionOfFocusedNode();

        if (focusedNode !==  null) {
            if (window.player.spatialNavigation.lastFocusedComponent_) {
                window.player.spatialNavigation.refocusComponent();
            } else {
                window.player.spatialNavigation.focus(window.player.spatialNavigation.updateFocusableComponents()[0]);
            }
        }
    }

    const keyDownHandler = (event) => {
        switch(event.keyCode) {
            case 39: // ArrowRight
              focusNextSibling();
              break;
            case 37: // ArrowLeft
              focusPreviousSibling();
              break;
            case 40: // ArrowDown
              tryFocusBelow();
              break;
            default:
        } 
    };

    useEffect(() => {
        window.addEventListener("keydown", keyDownHandler);
    });

    const setRef = (ref) => {
        if (ref) {
            const nodesArray_ = [...nodesArray.current];
            nodesArray_.push(ref);
            nodesArray.current = nodesArray_;
        }
    };

    useEffect(() => {
        if (focusableSquaresRef.current && focusableSquaresRef.current.children) {
            if (nodesArray.current.length === focusableSquaresRef.current.children.length) {
                // Focus first square
                nodesArray.current[0].focus();
            }
        }
    }, [nodesArray]);

    return (
        <>
            <p className="focusable_squares_title">React component:</p>
            <div className="focusable_squares" ref={focusableSquaresRef}>
                <FocusableSquare setRef={setRef} />
                <FocusableSquare setRef={setRef} />
                <FocusableSquare setRef={setRef} />
                <FocusableSquare setRef={setRef} />
            </div>
        </>
    );
};

export default FocusableSquares;
