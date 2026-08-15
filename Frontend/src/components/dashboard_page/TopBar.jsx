import dashboard from "../../assets/icons/dashboard.svg"
import sidebar from "../../assets/icons/sidebar.svg"
import notification from "../../assets/icons/notification.svg"

const TopBar = ({ toggleSidebar }) => {
    return (
        <div className="h-[8vh] flex-1 border-b border-b-ink/10 bg-surface/50 flex items-center justify-between px-4 transition-all duration-300 ease-in-out">
            <div className="flex flex-row items-center gap-3">
                <button className="h-8 w-8 m-2 p-1 hover:cursor-pointer hover:bg-indigo/15 rounded-lg transition-all ease-linear flex items-center justify-center" onClick={toggleSidebar}>
                    <img src={sidebar} alt="" />
                </button>
                <div className="h-5 w-[1px] bg-ink/20" />
                <div className="m-2 text-xl font-mono flex flex-row items-center gap-2"><img src={dashboard} alt="" className="h-5 w-5" /> Dashboard</div>
            </div>
            <div className="flex flex-row items-center gap-4">
                <img src={notification} className="h-8 w-8 m-2 p-1 bg-indigo/10 border border-ink/30 hover:cursor-pointer hover:bg-indigo/15 rounded-lg transition-all ease-linear" />
                <div className="m-2 flex justify-center items-center h-10 w-10 bg-indigo/30 rounded-full">
                    PF
                </div>
            </div>
        </div>
    )
}

export default TopBar