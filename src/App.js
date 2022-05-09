import "./styles.css";
import HeroCarousel from "./HeroCarousel";

export default function App() {
  return (
    <div className="App">
      <HeroCarousel
        navDots
        navArrows={false}
        ariaLabel="sample"
        style={{ minHeight: "100px" }}
      >
        <div>
          <h1>Hello CodeSandbox</h1>
          <h2>Start editing to see some magic happen!</h2>
        </div>
        <div>
          <h1>Hello CodeSandbox</h1>
          <h2>Start editing to see some magic happen!</h2>
        </div>
        <div>
          <h1>Hello CodeSandbox</h1>
          <h2>Start editing to see some magic happen!</h2>
        </div>
      </HeroCarousel>
    </div>
  );
}
