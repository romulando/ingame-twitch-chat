import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CgBorderStyleSolid } from 'react-icons/cg';
import { IoClose } from 'react-icons/io5';
export default function Header() {
    return (_jsxs("header", { className: "w-screen h-8 flex justify-end items-center bg-gray-900/95 backdrop-blur-sm move-page transition-all duration-300 opacity-100 visible border-b border-gray-600 rounded-t-md", children: [_jsx("button", { className: "flex w-8 max-w-[32px] h-full justify-center items-center hover:bg-gray-800/80 no-move px-0.5 cursor-default group transition-all duration-200 rounded-sm", onClick: () => window.electron.ipcRenderer.send('close-file-preview-config'), children: _jsx(CgBorderStyleSolid, { className: "m-auto text-gray-300 group-hover:text-white", size: 16 }) }), _jsx("button", { className: "flex w-8 max-w-[32px] h-full justify-center items-center hover:bg-red-600/80 no-move px-0.5 cursor-default group transition-all duration-200 rounded-sm", onClick: () => window.electron.ipcRenderer.send('close-config'), children: _jsx(IoClose, { className: "m-auto text-gray-300 group-hover:text-white", size: 16 }) })] }));
}
