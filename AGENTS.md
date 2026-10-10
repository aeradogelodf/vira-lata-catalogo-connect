<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep additional store links in the existing singleton store_settings row; a parallel store/profile link source would duplicate institutional data.
- Render private catalog and admin images through StoreImage, with browser-only identity-scoped URL caching and the existing validated signer; never use a raw object path as an image URL.
