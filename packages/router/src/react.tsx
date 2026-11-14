import { Component, type ComponentProps, type ComponentType, createContext, type ReactNode, use, useSyncExternalStore } from "react";
import { fill } from "./path";
import { build, getState, type State, subscribe } from "./router";
import type { ErrorProps, Location, ParamsOf, RouteId, RoutePath, SearchOf, Target } from "./types";

type BoundaryProps = { fallback: ComponentType<ErrorProps>; children: ReactNode };
type BoundaryState = { caught?: ErrorProps };

export type LinkProps<Path extends RoutePath> = Omit<ComponentProps<"a">, "href"> & Target<Path>;

const Depth = createContext(-1);

function useRouter<Selected>(select: (state: State) => Selected): Selected {
	const snapshot = () => select(getState());
	return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Catches what a route throws while rendering, until the next navigation. */
class Boundary extends Component<BoundaryProps, BoundaryState> {
	state: BoundaryState = {};
	release?: () => void;

	static getDerivedStateFromError(error: Error): BoundaryState {
		return { caught: { error } };
	}

	componentDidMount(): void {
		this.release = subscribe(() => this.state.caught && this.setState({ caught: undefined }));
	}

	componentWillUnmount(): void {
		this.release?.();
	}

	render(): ReactNode {
		const { fallback: Fallback, children } = this.props;
		return this.state.caught ? <Fallback error={this.state.caught.error} /> : children;
	}
}

/** Renders the route one level below the one it sits in, the root route when it sits in none. */
export function Outlet(): ReactNode {
	const depth = use(Depth) + 1;
	const View = useRouter((state) => state.matches[depth]?.view);
	const fallback = useRouter((state) => state.matches[depth]?.route.error);
	if (!View) return null;

	const view = (
		<Depth value={depth}>
			<View />
		</Depth>
	);

	return fallback ? <Boundary fallback={fallback}>{view}</Boundary> : view;
}

/** A plain anchor with a typed target. `aria-current="page"` on its own page, `data-active` on the pages below it too. */
export function Link<const Path extends RoutePath>({ to, params, search, hash, ...props }: LinkProps<Path>): ReactNode {
	const path = fill(to, params);
	const active = useRouter(({ pathname }) => (pathname === path ? 2 : path !== "/" && pathname.startsWith(`${path}/`) ? 1 : 0));

	return (
		<a
			aria-current={active === 2 ? "page" : undefined}
			data-active={active ? "" : undefined}
			{...props}
			href={build({ to, params, search, hash })}
		/>
	);
}

/** The params of the URL, typed with every param name of the application. */
export function useParams(): ParamsOf<RouteId> {
	return useRouter((state) => state.params);
}

/** The validated search of a route, the same object until the query changes. */
export function useSearch<const Id extends RouteId>(id: Id): SearchOf<Id> {
	return useRouter((state) => {
		const search = state.searches[id];
		if (!search) throw new Error(`useSearch("${id}") is rendered outside of its route`);
		return search.value;
	});
}

/** A slice of the location: return a primitive, or a reference the selector did not create. */
export function useLocation<Selected>(select: (location: Location) => Selected): Selected {
	return useRouter(select);
}
