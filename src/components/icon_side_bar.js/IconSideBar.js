import React from 'react';
import "./style.css"
import { useDispatch } from 'react-redux';
import { menuActions } from '../../store/menu_slice';
const listItem = [
    {
        id:1,
        title:"EVENTS",
        color:"gold"
    },
    {
        id:2,
        title:"MOTION",
        color:"deepskyblue"
    },
    {
        id:3,
        title:"CONTROL",
        color:'limegreen'
    },
    {
        id:4,
        title:'LOOKS',
        color:'red'
    }
]

const IconSideBar = () => {
    const dispatch = useDispatch()
    const handleChangeMenu = (title, color) => {
        dispatch(menuActions.setMenu({title, color}))
    }
    return (
        <div className='icon-side-bar'>
            {
                listItem.map(({id, title, color}) =>(
                    <div key={id} className='icon-side-bar-list-item' onClick={(e) => handleChangeMenu(title, color)}>
                    <div className='list-item-dot' style={{backgroundColor:`${color}`}}>
                    </div>
                    <div>
                        {title}
                    </div>
            </div>
                ))
            }
        </div>
      );
}
 
export default IconSideBar;