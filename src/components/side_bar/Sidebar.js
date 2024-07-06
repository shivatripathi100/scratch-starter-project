import React from "react";
import Icon from "../Icon";
import IconSideBar from "../icon_side_bar.js/IconSideBar";
import "./style.css";
import { useSelector } from "react-redux";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { blocks } from "../../contants/blocks";

export default function Sidebar() {
  const menuTitle = useSelector((state) => state.menu.name).toLowerCase();
  const menuColor = useSelector((state) => state.menu.color);
  const menuList = blocks[`${menuTitle}`];

  return (
    <div className="w-60 flex-none h-full flex flex-row items-start border-r border-gray-200">
      <IconSideBar />
      <div className="side-bar-list">
        <h2 className="side-bar-heading">{menuTitle}</h2>
        <Droppable droppableId="menu-list-items">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {menuList.map(({ id, title }, index) => (
                <Draggable key={id} draggableId={`${id}`} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`list-content list-content-color-${menuColor}`}
                    >
                      {title}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </div>
    </div>
  );
}