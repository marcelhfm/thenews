import { useEffect, useState } from "react";
import type { AppRouter } from "../../../../backend/react-facing-backend/src";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const trpc = createTRPCReact<AppRouter>();

interface ITrpcWrapper {
  children: React.ReactNode;
}

export const TrpcWrapper = ({ children }: ITrpcWrapper) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  const { user, getAccessTokenSilently, isAuthenticated, isLoading } =
    useAuth0();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient, setTrpcClient] = useState<any>(null);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();

        setTrpcClient(() =>
          trpc.createClient({
            links: [
              httpBatchLink({
                url: backendUrl,

                headers() {
                  return {
                    Authorization: `Bearer ${accessToken}`,
                  };
                },
              }),
            ],
          })
        );
      } catch (error) {
        console.log(error);
      }
    };

    if (isAuthenticated && !isLoading) {
      getAccessToken();
    }
  }, [
    getAccessTokenSilently,
    user?.sub,
    isAuthenticated,
    isLoading,
    setTrpcClient,
  ]);

  if (trpcClient) {
    return (
      <>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      </>
    );
  } else if (!isAuthenticated) {
    return <>{children}</>;
  } else {
    return <LoadingSpinner />;
  }
};
