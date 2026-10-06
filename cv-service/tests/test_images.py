from app.images import cap_cloudinary_fetch

TRANSFORM = "w_800,q_auto,f_auto"


def test_inserts_transform_before_public_id():
    url = "https://res.cloudinary.com/demo/image/upload/snaps/verification/tok/a.jpg"
    assert cap_cloudinary_fetch(url, TRANSFORM) == (
        "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/snaps/verification/tok/a.jpg"
    )


def test_leaves_non_cloudinary_urls_untouched():
    url = "https://cdn.example.com/big.jpg"
    assert cap_cloudinary_fetch(url, TRANSFORM) == url


def test_does_not_double_apply_an_existing_transform():
    url = "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/x.jpg"
    assert cap_cloudinary_fetch(url, TRANSFORM) == url


def test_does_not_add_transform_to_bare_public_id_style_hosts():
    url = "https://res.cloudinary.com/demo/video/upload/x.mp4"
    assert cap_cloudinary_fetch(url, TRANSFORM) == url


def test_disabled_transform_returns_url_unchanged():
    url = "https://res.cloudinary.com/demo/image/upload/a.jpg"
    assert cap_cloudinary_fetch(url, "") == url